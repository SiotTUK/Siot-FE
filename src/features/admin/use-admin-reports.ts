import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  adminReportKeys,
  fetchAdminReport,
  fetchAdminReports,
  updateAdminReport,
  type AdminReportUpdateRequest,
  type ReportStatus,
} from './report-api'

export function useAdminReports(status: ReportStatus | '') {
  return useInfiniteQuery({
    queryKey: adminReportKeys.list(status),
    queryFn: ({ pageParam }) => fetchAdminReports(status, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

export function useAdminReport(reportId: number) {
  return useQuery({
    queryKey: adminReportKeys.detail(reportId),
    queryFn: () => fetchAdminReport(reportId),
    enabled: Number.isInteger(reportId) && reportId > 0,
    staleTime: 0,
  })
}

export function useUpdateAdminReport(reportId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminReportUpdateRequest) =>
      updateAdminReport(reportId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminReportKeys.all }),
  })
}
