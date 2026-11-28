import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { scheduleQueryKey, taxKeys } from '@/features/calendar/api'
import {
  adminScheduleKeys,
  createAdminSchedule,
  fetchAdminSchedules,
  generateTaxSchedules,
  updateAdminSchedule,
  type AdminScheduleRequest,
} from './schedule-api'
import { useGuides } from './use-admin'

/** After any change: admin schedules and the member calendar and tax screens. */
function useRefreshSchedules() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [adminScheduleKeys.all, scheduleQueryKey, taxKeys.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

/** `kind` "" = every kind. */
export function useAdminSchedules(year: number, kind = '') {
  return useQuery({
    queryKey: adminScheduleKeys.list(year, kind),
    queryFn: () => fetchAdminSchedules(year, kind),
  })
}

export function useCreateAdminSchedule() {
  const refresh = useRefreshSchedules()
  return useMutation({
    mutationFn: (body: AdminScheduleRequest) => createAdminSchedule(body),
    onSuccess: refresh,
  })
}

export function useUpdateAdminSchedule(scheduleId: number) {
  const refresh = useRefreshSchedules()
  return useMutation({
    mutationFn: (body: AdminScheduleRequest) =>
      updateAdminSchedule(scheduleId, body),
    onSuccess: refresh,
  })
}

export function useGenerateTaxSchedules() {
  const refresh = useRefreshSchedules()
  return useMutation({ mutationFn: generateTaxSchedules, onSuccess: refresh })
}

/** Items to link (GET /api/admin/guides) and their Korean titles by code. */
export function useGuideTitles() {
  const guides = useGuides()
  const titles = new Map(
    guides.data?.map((guide) => [guide.code, guide.title ?? guide.code]),
  )
  return { guides, titles }
}
