import { z } from 'zod'
import type {
  GuideTranslationResponse,
  GuideTranslationUpdateRequest,
} from './api'

const text = z.string()

/** Editable text of one guide translation; `docs` is one item per line. */
export const guideFormSchema = z.object({
  title: text.trim().min(1, 'admin.titleRequired'),
  summary: text,
  content: text,
  badge: text,
  place: text,
  docs: text,
  fee: text,
  law: text,
  penalty: text,
  sourceName: text,
  noticeChanged: z.boolean(),
})
export type GuideForm = z.input<typeof guideFormSchema>

/** Form layout: field, label key, multi-line or not. */
export const guideFields = [
  ['title', 'admin.fieldTitle', false],
  ['badge', 'admin.fieldBadge', false],
  ['summary', 'admin.fieldSummary', true],
  ['content', 'admin.fieldContent', true],
  ['place', 'admin.fieldPlace', true],
  ['docs', 'admin.fieldDocs', true],
  ['fee', 'admin.fieldFee', false],
  ['law', 'admin.fieldLaw', false],
  ['penalty', 'admin.fieldPenalty', true],
  ['sourceName', 'admin.fieldSourceName', false],
] as const

export function toGuideForm(
  saved: GuideTranslationResponse | null | undefined,
): GuideForm {
  return {
    title: saved?.title ?? '',
    summary: saved?.summary ?? '',
    content: saved?.content ?? '',
    badge: saved?.badge ?? '',
    place: saved?.place ?? '',
    docs: (saved?.docs ?? []).join('\n'),
    fee: saved?.fee ?? '',
    law: saved?.law ?? '',
    penalty: saved?.penalty ?? '',
    sourceName: saved?.sourceName ?? '',
    // Default to a typo-level edit; the admin opts in to "변경됨".
    noticeChanged: false,
  }
}

const optional = (value: string) => value.trim() || null

/** PUT replaces every field, so send all of them; blanks become null. */
export function toGuideRequest(form: GuideForm): GuideTranslationUpdateRequest {
  return {
    title: form.title.trim(),
    summary: optional(form.summary),
    content: optional(form.content),
    badge: optional(form.badge),
    place: optional(form.place),
    docs: form.docs
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    fee: optional(form.fee),
    law: optional(form.law),
    penalty: optional(form.penalty),
    sourceName: optional(form.sourceName),
    noticeChanged: form.noticeChanged,
  }
}
