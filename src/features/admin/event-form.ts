import { z } from 'zod'
import {
  eventCategories,
  eventRegions,
  type AdminEventCreateRequest,
  type AdminEventDetail,
  type AdminEventUpdateRequest,
  type EventField,
} from './event-api'

/** Same limits as the BE AdminEventCreateRequest / UpdateRequest. */
export const eventMaxLength = {
  title: 255,
  description: 10000,
  venue: 255,
  priceInfo: 1000,
  url: 2000,
} as const
const urlPattern = /^https?:\/\/\S+$/

const text = (max: number) => z.string().trim().max(max, 'admin.tooLong')
const url = text(eventMaxLength.url).refine(
  (value) => !value || urlPattern.test(value),
  'admin.documents.urlInvalid',
)

/** All inputs are strings; `multicultural` "" = decided by keywords. */
const eventFields = z.object({
  title: text(eventMaxLength.title).min(1, 'admin.titleRequired'),
  description: text(eventMaxLength.description),
  venue: text(eventMaxLength.venue),
  /** YYYY-MM-DD */
  startsOn: z.string(),
  endsOn: z.string(),
  /** HH:mm */
  startsAt: z.string(),
  endsAt: z.string(),
  priceInfo: text(eventMaxLength.priceInfo),
  /** datetime-local in Korea time, YYYY-MM-DDTHH:mm */
  applicationDeadline: z.string(),
  applicationUrl: url,
  sourceUrl: url,
  region: z.enum(['', ...eventRegions]),
  multicultural: z.enum(['', 'true', 'false']),
  category: z.enum(['', ...eventCategories]),
  thumbnailUrl: url,
})
export type EventForm = z.input<typeof eventFields>
export type ParsedEventForm = z.output<typeof eventFields>

type Issue = { path: [keyof EventForm]; message: string }

/** Rules the BE checks too: a date is required, start ≤ end, a region. */
function commonIssues(form: ParsedEventForm): Issue[] {
  const issues: Issue[] = []
  if (!form.startsOn && !form.endsOn)
    issues.push({ path: ['startsOn'], message: 'admin.events.dateRequired' })
  if (form.startsOn && form.endsOn && form.startsOn > form.endsOn)
    issues.push({ path: ['endsOn'], message: 'admin.events.dateOrder' })
  if (!form.region)
    issues.push({ path: ['region'], message: 'admin.events.regionRequired' })
  return issues
}

const addIssues = (issues: Issue[], ctx: z.RefinementCtx) =>
  issues.forEach((issue) => ctx.addIssue({ code: 'custom', ...issue }))

export const eventCreateSchema = eventFields.superRefine((form, ctx) =>
  addIssues(commonIssues(form), ctx),
)

/** Fields the BE cannot clear once set (null means "unchanged" there). */
const notClearable = [
  'startsOn',
  'endsOn',
  'startsAt',
  'endsAt',
  'applicationDeadline',
] as const satisfies readonly EventField[]

/** Edit also refuses to empty a date, time or deadline that has a value. */
export function eventUpdateSchema(saved: AdminEventDetail) {
  const before = toEventForm(saved)
  return eventFields.superRefine((form, ctx) => {
    const issues = commonIssues(form).filter(
      // A missing region stays missing unless the admin picks one.
      (issue) => !(issue.path[0] === 'region' && !before.region),
    )
    for (const field of notClearable)
      if (before[field] && !form[field])
        issues.push({ path: [field], message: 'admin.events.cannotClear' })
    addIssues(issues, ctx)
  })
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** ISO date-time → "YYYY-MM-DDTHH:mm" in Korea time (for datetime-local). */
export function toKoreaLocal(iso: string | null) {
  if (!iso) return ''
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return ''
  return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 16)
}

/** "YYYY-MM-DDTHH:mm" (Korea time) → ISO with +09:00. */
export const fromKoreaLocal = (value: string) => `${value}:00+09:00`

const hhmm = (value: string | null) => value?.slice(0, 5) ?? ''

export function toEventForm(saved?: AdminEventDetail | null): EventForm {
  return {
    title: saved?.title ?? '',
    description: saved?.description ?? '',
    venue: saved?.venue ?? '',
    startsOn: saved?.startsOn ?? '',
    endsOn: saved?.endsOn ?? '',
    startsAt: hhmm(saved?.startsAt ?? null),
    endsAt: hhmm(saved?.endsAt ?? null),
    priceInfo: saved?.priceInfo ?? '',
    applicationDeadline: toKoreaLocal(saved?.applicationDeadline ?? null),
    applicationUrl: saved?.applicationUrl ?? '',
    sourceUrl: saved?.sourceUrl ?? '',
    region: saved?.region ?? '',
    multicultural: saved
      ? (String(saved.multicultural) as 'true' | 'false')
      : '',
    category: saved?.category ?? '',
    thumbnailUrl: saved?.thumbnailUrl ?? '',
  }
}

const orNull = (value: string) => value || null

export function toEventCreateRequest(
  form: ParsedEventForm,
): AdminEventCreateRequest {
  return {
    title: form.title,
    description: orNull(form.description),
    venue: orNull(form.venue),
    startsOn: orNull(form.startsOn),
    endsOn: orNull(form.endsOn),
    startsAt: orNull(form.startsAt),
    endsAt: orNull(form.endsAt),
    priceInfo: orNull(form.priceInfo),
    applicationDeadline: form.applicationDeadline
      ? fromKoreaLocal(form.applicationDeadline)
      : null,
    applicationUrl: orNull(form.applicationUrl),
    sourceUrl: orNull(form.sourceUrl),
    // The create schema requires a region.
    region: form.region || 'SIHEUNG',
    multicultural: form.multicultural ? form.multicultural === 'true' : null,
    category: form.category || null,
    thumbnailUrl: orNull(form.thumbnailUrl),
  }
}

/** Fields whose change notifies subscribed members (NTF-02). */
export const scheduleFields = [
  'startsOn',
  'endsOn',
  'startsAt',
  'endsAt',
] as const satisfies readonly EventField[]

/**
 * Only changed fields, because every field sent is locked against the daily
 * collection. Text emptied → "" (cleared). An empty object = no change.
 */
export function toEventUpdateRequest(
  form: ParsedEventForm,
  saved: AdminEventDetail,
): AdminEventUpdateRequest {
  const before = toEventForm(saved)
  const body: AdminEventUpdateRequest = {}
  const changed = (field: keyof EventForm) => form[field] !== before[field]
  for (const field of [
    'title',
    'description',
    'venue',
    'priceInfo',
    'applicationUrl',
    'sourceUrl',
    'thumbnailUrl',
    ...scheduleFields,
  ] as const)
    if (changed(field)) body[field] = form[field]
  if (changed('applicationDeadline') && form.applicationDeadline)
    body.applicationDeadline = fromKoreaLocal(form.applicationDeadline)
  if (changed('region') && form.region) body.region = form.region
  if (changed('multicultural') && form.multicultural)
    body.multicultural = form.multicultural === 'true'
  if (changed('category') && form.category) body.category = form.category
  return body
}

/** "2026-12-18 ~ 2026-12-20"; one date when start and end are the same. */
export function eventPeriod(startsOn: string | null, endsOn: string | null) {
  const from = startsOn ?? endsOn
  const to = endsOn ?? startsOn
  if (!from) return ''
  return from === to ? from : `${from} ~ ${to}`
}
