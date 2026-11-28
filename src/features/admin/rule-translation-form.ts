import { z } from 'zod'
import type {
  GuideTranslationResponse,
  GuideTranslationUpdateRequest,
} from './api'
import { pointLines, ruleMaxLength } from './rule-form'

/** Languages edited on the rule screen; Korean is the rule form itself. */
export const ruleTranslationLanguages = ['en', 'zh', 'vi'] as const
export type RuleTranslationLanguage = (typeof ruleTranslationLanguages)[number]

const text = (max: number) => z.string().max(max, 'admin.tooLong')

/** One translated language of a living rule (same limits as the Korean form). */
export const ruleTranslationSchema = z.object({
  title: text(ruleMaxLength.title).trim().min(1, 'admin.titleRequired'),
  summary: text(ruleMaxLength.summary),
  points: z.string().refine((value) => {
    const lines = pointLines(value)
    return (
      lines.length <= 30 &&
      lines.every((line) => line.length <= ruleMaxLength.point)
    )
  }, 'admin.rules.pointsLimit'),
  when: text(ruleMaxLength.when),
  place: text(ruleMaxLength.place),
  fee: text(ruleMaxLength.fee),
  penalty: text(ruleMaxLength.penalty),
  law: text(ruleMaxLength.law),
  contact: text(ruleMaxLength.contact),
  noticeChanged: z.boolean(),
})
export type RuleTranslationForm = z.input<typeof ruleTranslationSchema>

/** Form layout: field, label key, multi-line or not. */
export const ruleTranslationFields = [
  ['title', 'admin.fieldTitle', false],
  ['summary', 'admin.fieldSummary', true],
  ['points', 'admin.rules.points', true],
  ['when', 'admin.rules.when', false],
  ['place', 'admin.rules.place', true],
  ['fee', 'admin.rules.fee', false],
  ['penalty', 'admin.rules.penalty', true],
  ['law', 'admin.rules.law', false],
  ['contact', 'admin.rules.contact', false],
] as const

export function toRuleTranslationForm(
  saved: GuideTranslationResponse | null | undefined,
): RuleTranslationForm {
  return {
    title: saved?.title ?? '',
    summary: saved?.summary ?? '',
    points: (saved?.points ?? []).join('\n'),
    when: saved?.when ?? '',
    place: saved?.place ?? '',
    fee: saved?.fee ?? '',
    penalty: saved?.penalty ?? '',
    law: saved?.law ?? '',
    contact: saved?.contact ?? '',
    noticeChanged: false,
  }
}

const optional = (value: string) => value.trim() || null

/**
 * PUT replaces the shared text fields, so the ones this form does not show
 * (content, badge, docs, source name) are sent back as saved. Rule fields are
 * always sent: "" clears `when` and `contact`.
 */
export function toRuleTranslationRequest(
  form: RuleTranslationForm,
  saved: GuideTranslationResponse | null | undefined,
): GuideTranslationUpdateRequest {
  return {
    title: form.title.trim(),
    summary: optional(form.summary),
    content: saved?.content ?? null,
    badge: saved?.badge ?? null,
    place: optional(form.place),
    docs: saved?.docs ?? [],
    fee: optional(form.fee),
    law: optional(form.law),
    penalty: optional(form.penalty),
    sourceName: saved?.sourceName ?? null,
    noticeChanged: form.noticeChanged,
    points: pointLines(form.points),
    when: form.when.trim(),
    contact: form.contact.trim(),
  }
}
