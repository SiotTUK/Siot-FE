import { z } from 'zod'
import type {
  GuideTranslationResponse,
  GuideTranslationUpdateRequest,
} from './api'

/** Same limits as the BE GuideTranslationUpdateRequest. */
export const guideMaxLength = {
  title: 255,
  summary: 5000,
  content: 20000,
  badge: 100,
  place: 2000,
  fee: 255,
  law: 255,
  penalty: 2000,
  sourceName: 255,
} as const
const docsMaxItems = 30
const docMaxLength = 255

const text = (max: number) => z.string().max(max, 'admin.tooLong')

/** `docs` textarea → one item per non-blank line. */
function docLines(docs: string) {
  return docs
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Editable text of one guide translation; `docs` is one item per line. */
export const guideFormSchema = z.object({
  title: text(guideMaxLength.title).trim().min(1, 'admin.titleRequired'),
  summary: text(guideMaxLength.summary),
  content: text(guideMaxLength.content),
  badge: text(guideMaxLength.badge),
  place: text(guideMaxLength.place),
  docs: z.string().refine((docs) => {
    const lines = docLines(docs)
    return (
      lines.length <= docsMaxItems &&
      lines.every((line) => line.length <= docMaxLength)
    )
  }, 'admin.docsLimit'),
  fee: text(guideMaxLength.fee),
  law: text(guideMaxLength.law),
  penalty: text(guideMaxLength.penalty),
  sourceName: text(guideMaxLength.sourceName),
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
    docs: docLines(form.docs),
    fee: optional(form.fee),
    law: optional(form.law),
    penalty: optional(form.penalty),
    sourceName: optional(form.sourceName),
    noticeChanged: form.noticeChanged,
  }
}
