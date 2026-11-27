import { apiRequest } from '@/shared/api/client'
import type { PageResponse } from '@/shared/api/types'

/** ADM-02~04, NTF-06: chatbot source documents (BE `AdminDocumentController`). */
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type ProcessingStage = 'EXTRACT' | 'SPLIT' | 'EMBEDDING' | 'INDEX'
export type ChangeType = 'NEW' | 'REPLACE' | 'REPROCESS'

export interface DocumentVersionSummary {
  versionId: number
  versionNo: number
  status: ProcessingStatus
  processedAt: string | null
  /** Pages left out of the index, e.g. "51-52,100"; null = none. */
  excludedPages: string | null
}

export interface DocumentResponse {
  documentId: number
  name: string
  sourceUrl: string | null
  /** YYYY-MM-DD */
  publishedOn: string | null
  /** false → left out of chatbot search (versions and chunks are kept). */
  active: boolean
  /** The version search uses; null until one finishes. */
  currentVersion: DocumentVersionSummary | null
  /** The last uploaded version (may be the current one). */
  latestVersion: DocumentVersionSummary | null
  createdAt: string
  updatedAt: string
}

export interface DocumentVersionResponse {
  versionId: number
  documentId: number
  versionNo: number
  originalFilename: string | null
  changeType: ChangeType | null
  changeSummary: string | null
  excludedPages: string | null
  status: ProcessingStatus
  current: boolean
  failedStage: ProcessingStage | null
  failureReason: string | null
  chunkCount: number
  uploadedBy: number | null
  uploadedAt: string
  processedAt: string | null
}

export interface DocumentCreateInput {
  file: File
  name: string
  sourceUrl: string
  publishedOn?: string
  excludedPages?: string
}

/** PATCH: only the fields sent change. */
export interface DocumentUpdateInput {
  name?: string
  sourceUrl?: string
  publishedOn?: string
  active?: boolean
}

export interface DocumentVersionInput {
  file: File
  changeSummary?: string
  /**
   * Required when the current version leaves pages out; '' keeps every
   * page. Omitted otherwise.
   */
  excludedPages?: string
}

/** BE limit (spring multipart max-file-size 30MB, PDF only). */
export const maxDocumentBytes = 30 * 1024 * 1024
export const documentFileType = 'application/pdf'

/** Client check before uploading; the server still validates. */
export function validateDocumentFile(file: File | undefined) {
  if (!file || file.size === 0) return 'DOCUMENT_FILE_REQUIRED'
  if (file.type !== documentFileType && !/\.pdf$/i.test(file.name))
    return 'DOCUMENT_FILE_INVALID'
  if (file.size > maxDocumentBytes) return 'DOCUMENT_FILE_TOO_LARGE'
}

/** A version is still being indexed: the screen refreshes until it ends. */
export const isProcessing = (status: ProcessingStatus | undefined) =>
  status === 'PENDING' || status === 'PROCESSING'

/**
 * "다시 반영" (retry): the BE only accepts a FAILED version newer than the
 * current one.
 */
export function canRetry(
  version: DocumentVersionResponse,
  current: DocumentVersionSummary | null,
) {
  return (
    version.status === 'FAILED' &&
    (current === null || version.versionNo > current.versionNo)
  )
}

export const documentKeys = {
  all: ['admin', 'documents'] as const,
  list: () => [...documentKeys.all, 'list'] as const,
  versions: (documentId: number) =>
    [...documentKeys.all, documentId, 'versions'] as const,
}

const base = '/api/admin/documents'

/** Appends only fields with a value (FormData has no null). */
function form(fields: Record<string, string | File | undefined>) {
  const body = new FormData()
  for (const [key, value] of Object.entries(fields))
    if (value !== undefined) body.set(key, value)
  return body
}

export function fetchDocuments(page: number, signal?: AbortSignal) {
  return apiRequest<PageResponse<DocumentResponse>>(
    `${base}?page=${page}&size=20`,
    { signal },
  )
}

export function createDocument(input: DocumentCreateInput) {
  return apiRequest<DocumentResponse>(base, {
    method: 'POST',
    body: form({
      file: input.file,
      name: input.name,
      sourceUrl: input.sourceUrl,
      publishedOn: input.publishedOn,
      excludedPages: input.excludedPages,
    }),
  })
}

export function updateDocument(documentId: number, body: DocumentUpdateInput) {
  return apiRequest<DocumentResponse>(`${base}/${documentId}`, {
    method: 'PATCH',
    body,
  })
}

export function fetchDocumentVersions(
  documentId: number,
  signal?: AbortSignal,
) {
  return apiRequest<DocumentVersionResponse[]>(
    `${base}/${documentId}/versions`,
    { signal },
  )
}

export function addDocumentVersion(
  documentId: number,
  input: DocumentVersionInput,
) {
  return apiRequest<DocumentVersionResponse>(`${base}/${documentId}/versions`, {
    method: 'POST',
    body: form({
      file: input.file,
      changeSummary: input.changeSummary,
      excludedPages: input.excludedPages,
    }),
  })
}

/** `excludedPages` undefined keeps the current value; '' keeps every page. */
export function reprocessDocument(documentId: number, excludedPages?: string) {
  return apiRequest<DocumentVersionResponse>(
    `${base}/${documentId}/reprocess`,
    {
      method: 'POST',
      body: excludedPages === undefined ? undefined : { excludedPages },
    },
  )
}

export function retryDocumentVersion(versionId: number) {
  return apiRequest<DocumentVersionResponse>(
    `/api/admin/document-versions/${versionId}/retry`,
    { method: 'POST' },
  )
}
