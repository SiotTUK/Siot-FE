import { z } from 'zod'
import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

export const ruleReportReasons = ['translation', 'content', 'other'] as const

/** BE `ContentReportRequest` limits (COM-01). */
const quotedTextMaxLength = 2000
const titleSnapshotMaxLength = 255

const apiReasons = {
  translation: 'TRANSLATION',
  content: 'CONTENT',
  other: 'OTHER',
} as const

export const ruleReportSchema = z.object({
  quotedText: z
    .string()
    .trim()
    .min(1, 'rules.report.quoteRequired')
    .max(quotedTextMaxLength, 'rules.report.quoteTooLong'),
  reason: z
    .string()
    .pipe(z.enum(ruleReportReasons, { error: 'rules.report.reasonRequired' })),
})

export type RuleReportInput = z.output<typeof ruleReportSchema>

/**
 * 정보 오류 신고 for a living rule: the BE takes the rule's slug as
 * `guideCode` (#14), so the FE content needs no BE id.
 */
export function submitRuleReport(
  body: RuleReportInput & {
    guideCode: string
    targetTitleSnapshot: string
    language: Language
  },
  isRequestCurrent: () => boolean,
) {
  return apiRequest<{ reportId: number }>('/api/reports', {
    method: 'POST',
    body: {
      ...body,
      targetTitleSnapshot: body.targetTitleSnapshot.slice(
        0,
        titleSnapshotMaxLength,
      ),
      reason: apiReasons[body.reason],
    },
    isRequestCurrent,
  })
}
