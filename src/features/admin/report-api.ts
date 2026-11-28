import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'

export const reportStatuses = [
  'RECEIVED',
  'IN_REVIEW',
  'RESOLVED',
  'REJECTED',
] as const
export const reportReasons = ['TRANSLATION', 'CONTENT', 'OTHER'] as const
export const reportTargetKinds = [
  'EVENT',
  'RULE',
  'CHECKLIST',
  'LIFE_CHANGE_TASK',
] as const

export type ReportStatus = (typeof reportStatuses)[number]
export type ReportReason = (typeof reportReasons)[number]
export type ReportTargetKind = (typeof reportTargetKinds)[number]

/**
 * ADM-07 `ContentReportResponse`. The reporter is only a member id: the BE
 * sends no email or name, and this screen shows nothing more.
 */
export interface AdminReport {
  reportId: number
  reporterUserId: number | null
  eventId: number | null
  guideId: number | null
  /** EVENT or RULE (any guide item); null when the target was removed. */
  targetType: 'EVENT' | 'RULE' | null
  /** Title when reported, kept even if the target is removed later. */
  targetTitleSnapshot: string | null
  quotedText: string | null
  language: Language
  reason: ReportReason
  description: string | null
  status: ReportStatus
  adminMemo: string | null
  processedBy: number | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
  /** Event id, or the guide item code (waste-food, CL-01, LC-01-1). */
  targetCode: string | null
  targetKind: ReportTargetKind | null
}

/** `PATCH /api/admin/reports/{id}`. A blank memo clears it. */
export interface AdminReportUpdateRequest {
  status: ReportStatus
  adminMemo: string | null
}

export const adminReportKeys = {
  all: ['admin', 'reports'] as const,
  list: (status: ReportStatus | '') =>
    [...adminReportKeys.all, 'list', status] as const,
  detail: (reportId: number) =>
    [...adminReportKeys.all, 'detail', reportId] as const,
}

/** Newest first. An empty status lists every report. */
export function fetchAdminReports(status: ReportStatus | '', page: number) {
  const search = new URLSearchParams({ page: String(page), size: '20' })
  if (status) search.set('status', status)
  return apiRequest<PageResponse<AdminReport>>(
    `/api/admin/reports?${search.toString()}`,
  )
}

export function fetchAdminReport(reportId: number) {
  return apiRequest<AdminReport>(`/api/admin/reports/${reportId}`)
}

export function updateAdminReport(
  reportId: number,
  body: AdminReportUpdateRequest,
) {
  return apiRequest<AdminReport>(`/api/admin/reports/${reportId}`, {
    method: 'PATCH',
    body,
  })
}

/** Admin screen that edits the reported content; undefined when removed. */
export function reportTargetPath(report: AdminReport): string | undefined {
  const code = report.targetCode
  switch (report.targetKind) {
    case 'EVENT':
      return report.eventId ? `/admin/events/${report.eventId}` : undefined
    case 'RULE':
      return code ? `/admin/rules/${encodeURIComponent(code)}` : undefined
    case 'CHECKLIST':
    case 'LIFE_CHANGE_TASK':
      return code ? `/admin/guides?code=${encodeURIComponent(code)}` : undefined
    default:
      return undefined
  }
}
