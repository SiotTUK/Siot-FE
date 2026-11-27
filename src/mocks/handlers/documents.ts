import { http, HttpResponse } from 'msw'
import type {
  DocumentResponse,
  DocumentVersionResponse,
  DocumentVersionSummary,
} from '@/features/admin/documents'
import {
  body,
  currentMember,
  error,
  page,
  persist,
  state,
  type MockDocument,
} from '../db'
import { requireAdmin } from './admin'

const base = '*/api/admin/documents'
const maxBytes = 30 * 1024 * 1024
const pagesPattern = /^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/
const urlPattern = /^https?:\/\/\S+$/

const notFound = () =>
  error(404, 'DOCUMENT_NOT_FOUND', '문서를 찾을 수 없습니다.')
const inProgress = () =>
  error(
    409,
    'DOCUMENT_VERSION_IN_PROGRESS',
    '이 문서의 다른 버전을 반영하는 중입니다. 끝난 뒤 다시 시도해 주세요.',
  )

const summary = (
  version: DocumentVersionResponse | undefined,
): DocumentVersionSummary | null =>
  version
    ? {
        versionId: version.versionId,
        versionNo: version.versionNo,
        status: version.status,
        processedAt: version.processedAt,
        excludedPages: version.excludedPages,
      }
    : null

function toResponse(document: MockDocument): DocumentResponse {
  const { versions, ...info } = document
  return {
    ...info,
    currentVersion: summary(versions.find((version) => version.current)),
    latestVersion: summary(versions.at(-1)),
  }
}

/**
 * Background indexing (ADM-04) in steps: every read moves a waiting version
 * on (PENDING → PROCESSING → COMPLETED). A file named "fail…" fails at the
 * embedding step and the previous version stays current, like the BE.
 */
function advance(document: MockDocument) {
  for (const version of document.versions) {
    if (version.status === 'PENDING') version.status = 'PROCESSING'
    else if (version.status === 'PROCESSING') {
      version.processedAt = new Date().toISOString()
      if (version.originalFilename?.startsWith('fail')) {
        version.status = 'FAILED'
        version.failedStage = 'EMBEDDING'
        version.failureReason = 'Gemini 임베딩 실패: 503'
      } else {
        version.status = 'COMPLETED'
        version.chunkCount = 120
        for (const other of document.versions) other.current = false
        version.current = true
      }
    }
  }
}

const find = (id: unknown) =>
  state.documents.find((document) => String(document.documentId) === id)

const nextVersionId = () =>
  Math.max(
    0,
    ...state.documents.flatMap((d) => d.versions.map((v) => v.versionId)),
  ) + 1

/** Multipart file checks shared by create and new version (BE validator). */
function fileError(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0)
    return error(400, 'INVALID_INPUT', '파일을 올려 주세요.')
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))
    return error(400, 'DOCUMENT_FILE_INVALID', 'PDF 파일만 올릴 수 있습니다.')
  if (file.size > maxBytes)
    return error(
      413,
      'DOCUMENT_FILE_TOO_LARGE',
      '파일이 너무 큽니다. 30MB 이하로 올려 주세요.',
    )
}

function pagesError(pages: string | null) {
  if (pages && !pagesPattern.test(pages))
    return error(
      400,
      'DOCUMENT_EXCLUDED_PAGES_INVALID',
      '뺄 쪽 형식이 올바르지 않습니다.',
    )
}

/** Same blank-to-null and comma spacing as the BE. */
const normalizePages = (pages: string | null) =>
  pages?.trim() ? pages.replace(/\s+/g, '') : null

function newVersion(
  document: MockDocument,
  fields: Partial<DocumentVersionResponse>,
): DocumentVersionResponse {
  return {
    versionId: nextVersionId(),
    documentId: document.documentId,
    versionNo: (document.versions.at(-1)?.versionNo ?? 0) + 1,
    originalFilename: null,
    changeType: 'REPLACE',
    changeSummary: null,
    excludedPages: null,
    status: 'PENDING',
    current: false,
    failedStage: null,
    failureReason: null,
    chunkCount: 0,
    uploadedBy: currentMember()?.id ?? null,
    uploadedAt: new Date().toISOString(),
    processedAt: null,
    ...fields,
  }
}

const busy = (document: MockDocument) =>
  document.versions.some(
    (version) =>
      version.status === 'PENDING' || version.status === 'PROCESSING',
  )

/** ADM-02~04, NTF-06 (BE `AdminDocumentController`). Admins only. */
export const documentHandlers = [
  http.get(base, ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    state.documents.forEach(advance)
    persist()
    const rows = [...state.documents]
      .sort((a, b) => b.documentId - a.documentId)
      .map(toResponse)
    return HttpResponse.json({ data: page(rows, new URL(request.url)) })
  }),

  http.post(base, async ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const form = await request.formData()
    const file = form.get('file')
    const name = String(form.get('name') ?? '').trim()
    const sourceUrl = String(form.get('sourceUrl') ?? '').trim()
    const pages = form.get('excludedPages') as string | null
    const invalid = fileError(file) ?? pagesError(pages)
    if (invalid) return invalid
    if (!name || !urlPattern.test(sourceUrl))
      return error(400, 'INVALID_INPUT', '입력값을 확인해 주세요.')
    const now = new Date().toISOString()
    const document: MockDocument = {
      documentId: state.nextDocumentId++,
      name,
      sourceUrl,
      publishedOn: (form.get('publishedOn') as string | null) || null,
      active: true,
      createdAt: now,
      updatedAt: now,
      versions: [],
    }
    document.versions.push(
      newVersion(document, {
        originalFilename: (file as File).name,
        changeType: 'NEW',
        excludedPages: normalizePages(pages),
      }),
    )
    state.documents.push(document)
    persist()
    return HttpResponse.json({ data: toResponse(document) }, { status: 201 })
  }),

  http.patch(`${base}/:documentId`, async ({ params, request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const document = find(params.documentId)
    if (!document) return notFound()
    const input = await body(request)
    // PATCH: only the fields sent change.
    if (typeof input.name === 'string') document.name = input.name
    if (typeof input.sourceUrl === 'string')
      document.sourceUrl = input.sourceUrl
    if (typeof input.publishedOn === 'string')
      document.publishedOn = input.publishedOn
    if (typeof input.active === 'boolean') document.active = input.active
    document.updatedAt = new Date().toISOString()
    persist()
    return HttpResponse.json({ data: toResponse(document) })
  }),

  http.get(`${base}/:documentId/versions`, ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const document = find(params.documentId)
    if (!document) return notFound()
    advance(document)
    persist()
    return HttpResponse.json({ data: [...document.versions].reverse() })
  }),

  http.post(`${base}/:documentId/versions`, async ({ params, request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const document = find(params.documentId)
    if (!document) return notFound()
    const form = await request.formData()
    const file = form.get('file')
    const pages = form.get('excludedPages') as string | null
    const invalid = fileError(file) ?? pagesError(pages)
    if (invalid) return invalid
    if (busy(document)) return inProgress()
    const current = document.versions.find((version) => version.current)
    if (current?.excludedPages && pages === null)
      return error(
        400,
        'DOCUMENT_EXCLUDED_PAGES_REQUIRED',
        '현재 버전에 적재에서 뺀 쪽이 있습니다. 새 파일의 뺄 쪽을 보내 주세요 (빼지 않으려면 빈 값).',
      )
    if (current?.originalFilename === (file as File).name)
      return error(
        409,
        'DOCUMENT_FILE_UNCHANGED',
        '현재 버전과 같은 파일입니다.',
      )
    const version = newVersion(document, {
      originalFilename: (file as File).name,
      changeSummary: (form.get('changeSummary') as string | null) || null,
      excludedPages: normalizePages(pages),
    })
    document.versions.push(version)
    persist()
    return HttpResponse.json({ data: version }, { status: 201 })
  }),

  http.post(`${base}/:documentId/reprocess`, async ({ params, request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const document = find(params.documentId)
    if (!document) return notFound()
    const input = (await request.json().catch(() => null)) as {
      excludedPages?: string
    } | null
    const pages = input?.excludedPages
    const invalid = pagesError(pages ?? null)
    if (invalid) return invalid
    if (busy(document)) return inProgress()
    const current = document.versions.find((version) => version.current)
    if (!current)
      return error(
        409,
        'DOCUMENT_CURRENT_VERSION_MISSING',
        '검색에 쓰는 현재 버전이 없어 재처리할 수 없습니다.',
      )
    const version = newVersion(document, {
      originalFilename: current.originalFilename,
      changeType: 'REPROCESS',
      excludedPages:
        pages === undefined ? current.excludedPages : normalizePages(pages),
    })
    document.versions.push(version)
    persist()
    return HttpResponse.json({ data: version }, { status: 202 })
  }),

  http.post('*/api/admin/document-versions/:versionId/retry', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const document = state.documents.find((d) =>
      d.versions.some((v) => String(v.versionId) === params.versionId),
    )
    const version = document?.versions.find(
      (v) => String(v.versionId) === params.versionId,
    )
    if (!document || !version)
      return error(
        404,
        'DOCUMENT_VERSION_NOT_FOUND',
        '문서 버전을 찾을 수 없습니다.',
      )
    const current = document.versions.find((v) => v.current)
    if (
      version.status !== 'FAILED' ||
      (current && version.versionNo < current.versionNo)
    )
      return error(
        409,
        'DOCUMENT_VERSION_NOT_RETRYABLE',
        '다시 반영할 수 없는 버전입니다.',
      )
    if (busy(document)) return inProgress()
    Object.assign(version, {
      status: 'PENDING',
      failedStage: null,
      failureReason: null,
      processedAt: null,
      // A retried "fail…" file succeeds, so the flow can be tried out.
      originalFilename: version.originalFilename?.replace(/^fail/, 'retried'),
    })
    persist()
    return HttpResponse.json({ data: version }, { status: 202 })
  }),
]
