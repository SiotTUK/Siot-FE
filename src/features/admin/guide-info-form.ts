import { z } from 'zod'
import type { GuideInfoResponse, GuideInfoUpdateRequest } from './api'

/** Same limits as the BE GuideInfoUpdateRequest. */
export const guideInfoMaxLength = { sourceUrl: 2000, contact: 255 } as const
const urlPattern = /^https?:\/\/\S+$/

/** Source link and contact of an item, filled with the saved values. */
export const guideInfoFormSchema = z.object({
  sourceUrl: z
    .string()
    .trim()
    .max(guideInfoMaxLength.sourceUrl, 'admin.tooLong')
    // A front-end hint only; the BE validates the same pattern.
    .refine(
      (url) => !url || urlPattern.test(url),
      'admin.documents.urlInvalid',
    ),
  contact: z.string().trim().max(guideInfoMaxLength.contact, 'admin.tooLong'),
})
export type GuideInfoForm = z.input<typeof guideInfoFormSchema>
type ParsedGuideInfoForm = z.output<typeof guideInfoFormSchema>

export function toGuideInfoForm(saved: GuideInfoResponse): GuideInfoForm {
  return { sourceUrl: saved.sourceUrl ?? '', contact: saved.contact ?? '' }
}

/**
 * PATCH keeps omitted fields, so only fields that differ from the saved
 * values are sent; an emptied field is sent as "" so the BE clears it.
 * An empty object means nothing changed.
 */
export function toGuideInfoRequest(
  form: ParsedGuideInfoForm,
  saved: GuideInfoResponse,
): GuideInfoUpdateRequest {
  const changed = (value: string, before: string | null) =>
    value !== (before ?? '')
  return {
    ...(changed(form.sourceUrl, saved.sourceUrl) && {
      sourceUrl: form.sourceUrl,
    }),
    ...(changed(form.contact, saved.contact) && { contact: form.contact }),
  }
}
