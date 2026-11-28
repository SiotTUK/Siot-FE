import { z } from 'zod'
import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

export const checklistReportReasons = [
  'translation',
  'content',
  'other',
] as const

// The API accepts only these reason codes (BE ContentReportRequest).
const apiReasons = {
  translation: 'TRANSLATION',
  content: 'CONTENT',
  other: 'OTHER',
} as const

export const checklistReportSchema = z.object({
  quotedText: z.string().trim().min(1, 'checklist.report.quoteRequired'),
  reason: z.string().pipe(
    z.enum(checklistReportReasons, {
      error: 'checklist.report.reasonRequired',
    }),
  ),
})

export type ChecklistReportInput = z.output<typeof checklistReportSchema>

export function submitChecklistReport(
  body: ChecklistReportInput & {
    guideId?: number | null
    guideCode?: string
    targetTitleSnapshot: string
    language: Language
  },
  isRequestCurrent: () => boolean,
) {
  return apiRequest<{ reportId: number }>('/api/reports', {
    method: 'POST',
    body: {
      guideId: body.guideId ?? undefined,
      guideCode: body.guideCode,
      targetTitleSnapshot: body.targetTitleSnapshot,
      quotedText: body.quotedText,
      language: body.language,
      reason: apiReasons[body.reason],
    },
    isRequestCurrent,
  })
}
