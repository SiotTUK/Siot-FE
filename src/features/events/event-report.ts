import { z } from 'zod'
import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

export const eventReportReasons = ['translation', 'content', 'other'] as const

// The API stores the reason as text. Keep it consistent for report reviewers.
const storedReasons = {
  translation: '번역 오류',
  content: '내용 오류',
  other: '기타',
}

export const eventReportSchema = z.object({
  quotedText: z.string().trim().min(1, 'events.report.quoteRequired'),
  reason: z
    .string()
    .pipe(
      z.enum(eventReportReasons, { error: 'events.report.reasonRequired' }),
    ),
})

export type EventReportInput = z.output<typeof eventReportSchema>

export function submitEventReport(
  body: EventReportInput & {
    eventId: number
    targetTitleSnapshot: string
    language: Language
  },
  isRequestCurrent: () => boolean,
) {
  return apiRequest<{ reportId: number }>('/api/reports', {
    method: 'POST',
    body: { ...body, reason: storedReasons[body.reason] },
    isRequestCurrent,
  })
}
