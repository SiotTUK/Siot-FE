import { useCallback } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  addDocumentVersion,
  createDocument,
  documentKeys,
  fetchDocuments,
  fetchDocumentVersions,
  isProcessing,
  reprocessDocument,
  retryDocumentVersion,
  updateDocument,
  type DocumentUpdateInput,
  type DocumentVersionInput,
} from './documents'

/** While a version is indexed (ADM-04), statuses refresh on their own. */
export const processingRefreshMs = 5000

export function useDocuments() {
  return useInfiniteQuery({
    queryKey: documentKeys.list(),
    queryFn: ({ pageParam, signal }) => fetchDocuments(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    refetchInterval: ({ state }) =>
      state.data?.pages.some((page) =>
        page.content.some((document) =>
          isProcessing(document.latestVersion?.status),
        ),
      )
        ? processingRefreshMs
        : false,
  })
}

/** Reloads the document list (current/latest version of every card). */
export function useRefreshDocuments() {
  const client = useQueryClient()
  return useCallback(
    () => client.invalidateQueries({ queryKey: documentKeys.list() }),
    [client],
  )
}

export function useDocumentVersions(documentId: number) {
  return useQuery({
    queryKey: documentKeys.versions(documentId),
    queryFn: ({ signal }) => fetchDocumentVersions(documentId, signal),
    refetchInterval: ({ state }) =>
      state.data?.some((version) => isProcessing(version.status))
        ? processingRefreshMs
        : false,
  })
}

/** After any change the list (current/latest version) and versions reload. */
function useRefresh(documentId?: number) {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: documentKeys.list() }),
      documentId === undefined
        ? undefined
        : client.invalidateQueries({
            queryKey: documentKeys.versions(documentId),
          }),
    ])
}

export function useCreateDocument() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: createDocument, onSuccess: refresh })
}

export function useUpdateDocument(documentId: number) {
  const refresh = useRefresh(documentId)
  return useMutation({
    mutationFn: (body: DocumentUpdateInput) => updateDocument(documentId, body),
    onSuccess: refresh,
  })
}

export function useAddDocumentVersion(documentId: number) {
  const refresh = useRefresh(documentId)
  return useMutation({
    mutationFn: (input: DocumentVersionInput) =>
      addDocumentVersion(documentId, input),
    onSuccess: refresh,
  })
}

export function useReprocessDocument(documentId: number) {
  const refresh = useRefresh(documentId)
  return useMutation({
    mutationFn: (excludedPages?: string) =>
      reprocessDocument(documentId, excludedPages),
    onSuccess: refresh,
  })
}

export function useRetryDocumentVersion(documentId: number) {
  const refresh = useRefresh(documentId)
  return useMutation({
    mutationFn: retryDocumentVersion,
    onSuccess: refresh,
  })
}
