import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

export type ChecklistStatus = 'TODO' | 'DONE' | 'NOT_APPLICABLE' | 'OVERDUE'

/** One item of the personalized checklist. Deadlines and D-day come from the server. */
export interface ChecklistItemResponse {
  /** CL-01, LC-01-1 ... */
  code: string
  title: string
  kind: 'CHECKLIST' | 'LIFE_CHANGE_TASK' | 'RULE'
  itemType: 'REQUIRED' | 'INFO' | 'OPTIONAL'
  /** e.g. "입국 후 90일 이내" */
  badge: string | null
  place: string | null
  docs: string[]
  fee: string | null
  law: string | null
  penalty: string | null
  contact: string | null
  sourceUrl: string | null
  sourceName: string | null
  summary: string | null
  content: string | null
  /** Condition-specific text (CL-04 by purpose, warnings). */
  variantBodies: string[]
  /** YYYY-MM-DD, null = no deadline */
  deadline: string | null
  /** Negative = past, 0 = today, positive = days left. */
  dDay: number | null
  /** Server text: "D-73", "D-Day", "기한 지남" ... */
  dDayText: string | null
  status: ChecklistStatus
  completed: boolean
  /** '' once, YYYY-MM for taxes, YYYY-MM-DD for life changes. Sent back on update. */
  periodKey: string
  noticeChangedAt: string | null
  /** Guidance changed within 14 days. */
  hasNoticeChanged: boolean
  /** CL-05 extension application start date. */
  applyStartsOn: string | null
  /** CL-05 from 30 days before expiry. */
  highlighted: boolean
}

export interface ChecklistSummaryResponse {
  totalRequiredCount: number
  completedRequiredCount: number
  progressPercentage: number
  items: ChecklistItemResponse[]
}

/** DONE / NOT_APPLICABLE, or null to go back to TODO. */
export type ChecklistMark = 'DONE' | 'NOT_APPLICABLE' | null

export const checklistKeys = {
  all: ['checklist'] as const,
  member: (memberId: number) => [...checklistKeys.all, memberId] as const,
  summary: (memberId: number, language: Language) =>
    [...checklistKeys.member(memberId), language] as const,
}

export function fetchChecklist(language: Language, signal?: AbortSignal) {
  return apiRequest<ChecklistSummaryResponse>(
    `/api/members/me/checklist?language=${language}`,
    { signal },
  )
}

export function updateChecklistItem(
  code: string,
  body: { periodKey: string; status: ChecklistMark },
  isSessionCurrent?: () => boolean,
) {
  return apiRequest(`/api/members/me/checklist/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body,
    isRequestCurrent: isSessionCurrent,
  })
}
