import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/setup'
import { login } from '@/features/auth/api'
import {
  addDocumentVersion,
  canRetry,
  createDocument,
  fetchDocuments,
  fetchDocumentVersions,
  maxDocumentBytes,
  reprocessDocument,
  retryDocumentVersion,
  updateDocument,
  validateDocumentFile,
  type DocumentVersionResponse,
} from './documents'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
const admin = { email: 'admin@example.com', password: 'admin1234' }
const pdf = (name = 'guide.pdf', content = 'pdf') =>
  new File([content], name, { type: 'application/pdf' })

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      interceptedFetch(
        typeof input === 'string' ? new URL(input, origin) : input,
        init,
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('document file check', () => {
  it('accepts a PDF up to 30MB only', () => {
    expect(validateDocumentFile(pdf())).toBeUndefined()
    expect(validateDocumentFile(undefined)).toBe('DOCUMENT_FILE_REQUIRED')
    expect(validateDocumentFile(new File([], 'empty.pdf'))).toBe(
      'DOCUMENT_FILE_REQUIRED',
    )
    expect(
      validateDocumentFile(new File(['x'], 'a.png', { type: 'image/png' })),
    ).toBe('DOCUMENT_FILE_INVALID')
    expect(
      validateDocumentFile(
        new File([new Uint8Array(maxDocumentBytes + 1)], 'big.pdf', {
          type: 'application/pdf',
        }),
      ),
    ).toBe('DOCUMENT_FILE_TOO_LARGE')
  })

  it('offers retry only for a failed version newer than the current one', () => {
    const version = (versionNo: number, status: string) =>
      ({ versionNo, status }) as DocumentVersionResponse
    const current = {
      versionId: 1,
      versionNo: 2,
      status: 'COMPLETED' as const,
      processedAt: null,
      excludedPages: null,
    }
    expect(canRetry(version(3, 'FAILED'), current)).toBe(true)
    expect(canRetry(version(1, 'FAILED'), current)).toBe(false)
    expect(canRetry(version(3, 'COMPLETED'), current)).toBe(false)
    expect(canRetry(version(1, 'FAILED'), null)).toBe(true)
  })
})

describe('ADM-02~04 documents (MSW contract)', () => {
  it('rejects regular members', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    await expect(fetchDocuments(0)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
  })

  it('sends the new document as multipart and lists it while it is indexed', async () => {
    await login(admin)
    let received: Record<string, unknown> | undefined
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url.endsWith('/documents'))
        received = { type: request.headers.get('content-type') }
    })
    const created = await createDocument({
      file: pdf('stay.pdf'),
      name: '체류 안내',
      sourceUrl: 'https://example.com/stay.pdf',
      publishedOn: '2026-11-01',
      excludedPages: '3, 5-6',
    })
    server.events.removeAllListeners()
    expect(String(received?.type)).toMatch(/^multipart\/form-data; boundary=/)
    expect(created).toMatchObject({
      name: '체류 안내',
      publishedOn: '2026-11-01',
      currentVersion: null,
      latestVersion: {
        versionNo: 1,
        status: 'PENDING',
        excludedPages: '3,5-6',
      },
    })
    // Each read moves indexing on: PROCESSING, then COMPLETED and current.
    const first = await fetchDocuments(0)
    expect(first.content[0].latestVersion?.status).toBe('PROCESSING')
    const second = await fetchDocuments(0)
    expect(second.content[0]).toMatchObject({
      currentVersion: { versionNo: 1, status: 'COMPLETED' },
    })
  })

  it('maps server file and page errors to ApiError codes', async () => {
    await login(admin)
    const input = { name: 'x', sourceUrl: 'https://example.com/x.pdf' }
    await expect(
      createDocument({
        ...input,
        file: new File(['x'], 'x.png', { type: 'image/png' }),
      }),
    ).rejects.toMatchObject({ status: 400, code: 'DOCUMENT_FILE_INVALID' })
    await expect(
      createDocument({ ...input, file: pdf(), excludedPages: 'abc' }),
    ).rejects.toMatchObject({ code: 'DOCUMENT_EXCLUDED_PAGES_INVALID' })
  })

  it('requires excluded pages when the current version leaves pages out', async () => {
    await login(admin)
    // Seed document 1: v1 current, pages 51-52 left out.
    await expect(
      addDocumentVersion(1, { file: pdf('guide-2027.pdf') }),
    ).rejects.toMatchObject({ code: 'DOCUMENT_EXCLUDED_PAGES_REQUIRED' })
    const version = await addDocumentVersion(1, {
      file: pdf('guide-2027.pdf'),
      changeSummary: '2027년 기준',
      excludedPages: '',
    })
    expect(version).toMatchObject({
      versionNo: 2,
      changeType: 'REPLACE',
      excludedPages: null,
      status: 'PENDING',
    })
    await expect(
      addDocumentVersion(1, { file: pdf('other.pdf'), excludedPages: '' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'DOCUMENT_VERSION_IN_PROGRESS',
    })
  })

  it('retries a failed version and keeps the old one current meanwhile', async () => {
    await login(admin)
    await addDocumentVersion(1, { file: pdf('fail.pdf'), excludedPages: '' })
    await fetchDocumentVersions(1) // PROCESSING
    const versions = await fetchDocumentVersions(1) // FAILED
    expect(versions[0]).toMatchObject({
      versionNo: 2,
      status: 'FAILED',
      failedStage: 'EMBEDDING',
    })
    expect(versions[1]).toMatchObject({ versionNo: 1, current: true })
    await expect(
      retryDocumentVersion(versions[1].versionId),
    ).rejects.toMatchObject({ code: 'DOCUMENT_VERSION_NOT_RETRYABLE' })
    await expect(
      retryDocumentVersion(versions[0].versionId),
    ).resolves.toMatchObject({ status: 'PENDING' })
  })

  it('reprocesses the current version and updates only the fields sent', async () => {
    await login(admin)
    await expect(reprocessDocument(1)).resolves.toMatchObject({
      changeType: 'REPROCESS',
      excludedPages: '51-52',
    })
    const updated = await updateDocument(1, { active: false })
    expect(updated).toMatchObject({
      active: false,
      name: '시흥시 외국인주민 생활안내',
    })
  })

  it('omits a reprocess body to keep the current pages', async () => {
    await login(admin)
    let sent: string | null = 'unset'
    server.use(
      http.post(
        `${origin}/api/admin/documents/1/reprocess`,
        async ({ request }) => {
          sent = await request.text()
          return HttpResponse.json({ data: null }, { status: 202 })
        },
      ),
    )
    await reprocessDocument(1)
    expect(sent).toBe('')
    await reprocessDocument(1, '')
    expect(sent).toBe('{"excludedPages":""}')
  })
})
