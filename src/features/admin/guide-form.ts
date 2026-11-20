import type {
  GuideTranslationResponse,
  GuideTranslationUpdateRequest,
} from './api'

/** Editable text of one guide translation; `docs` is one item per line. */
export interface GuideForm {
  title: string
  summary: string
  content: string
  badge: string
  place: string
  docs: string
  fee: string
  law: string
  penalty: string
  sourceName: string
  noticeChanged: boolean
}

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
