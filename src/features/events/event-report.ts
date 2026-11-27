import { z } from 'zod'
import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

export const eventReportReasons = ['translation', 'content', 'other'] as const

/** BE `ContentReportRequest` limits (COM-01). */
export const quotedTextMaxLength = 2000
const titleSnapshotMaxLength = 255

// The API accepts only these reason codes.
const apiReasons = {
  translation: 'TRANSLATION',
  content: 'CONTENT',
  other: 'OTHER',
} as const

export const eventReportSchema = z.object({
  quotedText: z
    .string()
    .trim()
    .min(1, 'events.report.quoteRequired')
    .max(quotedTextMaxLength, 'events.report.quoteTooLong'),
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
    body: {
      ...body,
      // The server stores its own Korean title when the snapshot is blank.
      targetTitleSnapshot: body.targetTitleSnapshot.slice(
        0,
        titleSnapshotMaxLength,
      ),
      reason: apiReasons[body.reason],
    },
    isRequestCurrent,
  })
}
