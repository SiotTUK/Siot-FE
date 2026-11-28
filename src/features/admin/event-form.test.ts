import { describe, expect, it } from 'vitest'
import type { AdminEventDetail } from './event-api'
import {
  eventCreateSchema,
  eventPeriod,
  eventUpdateSchema,
  fromKoreaLocal,
  toEventCreateRequest,
  toEventForm,
  toEventUpdateRequest,
  toKoreaLocal,
  type EventForm,
} from './event-form'

const saved: AdminEventDetail = {
  eventId: 12,
  title: '시흥갯골축제',
  description: '설명',
  venue: '갯골생태공원',
  startsOn: '2026-12-18',
  endsOn: '2026-12-20',
  startsAt: '14:00:00',
  endsAt: null,
  timeUnknown: false,
  priceInfo: '무료',
  applicationDeadline: '2026-12-10T09:00:00Z',
  applicationUrl: null,
  sourceUrl: 'https://www.siheung.go.kr/',
  region: 'SIHEUNG',
  multicultural: false,
  category: 'FESTIVAL',
  source: 'GGC',
  externalId: 'GGC-1',
  status: 'ACTIVE',
  revision: 3,
  lockedFields: ['title'],
  tags: [],
  translatedLanguages: ['ko', 'en'],
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-02T00:00:00Z',
  thumbnailUrl: null,
}

const update = (form: Partial<EventForm>) => {
  const parsed = eventUpdateSchema(saved).safeParse({
    ...toEventForm(saved),
    ...form,
  })
  if (!parsed.success) return parsed.error.issues[0]
  return toEventUpdateRequest(parsed.data, saved)
}

describe('admin event form', () => {
  it('reads the deadline in Korea time and sends it back with +09:00', () => {
    expect(toKoreaLocal('2026-12-10T09:00:00Z')).toBe('2026-12-10T18:00')
    expect(fromKoreaLocal('2026-12-10T18:00')).toBe('2026-12-10T18:00:00+09:00')
    expect(toEventForm(saved)).toMatchObject({
      startsAt: '14:00',
      endsAt: '',
      multicultural: 'false',
      applicationDeadline: '2026-12-10T18:00',
    })
  })

  it('sends only changed fields, because every field sent is locked', () => {
    expect(update({})).toEqual({})
    expect(update({ title: ' 시흥갯골축제 ' })).toEqual({})
    expect(update({ venue: '', startsAt: '15:30', category: 'EVENT' })).toEqual(
      {
        venue: '',
        startsAt: '15:30',
        category: 'EVENT',
      },
    )
    expect(
      update({
        applicationDeadline: '2026-12-11T18:00',
        multicultural: 'true',
      }),
    ).toEqual({
      applicationDeadline: '2026-12-11T18:00:00+09:00',
      multicultural: true,
    })
  })

  it('refuses to empty dates, times and the deadline on edit', () => {
    expect(update({ startsAt: '' })).toMatchObject({
      path: ['startsAt'],
      message: 'admin.events.cannotClear',
    })
    expect(update({ applicationDeadline: '' })).toMatchObject({
      path: ['applicationDeadline'],
    })
    // A field that was empty stays empty without an error.
    expect(update({ endsAt: '' })).toEqual({})
    expect(update({ endsOn: '2026-12-01' })).toMatchObject({
      path: ['endsOn'],
      message: 'admin.events.dateOrder',
    })
  })

  it('creates with nulls for blanks and keyword defaults', () => {
    const base = {
      ...toEventForm(null),
      title: '외국인 주민 한국어 교실',
      startsOn: '2026-12-18',
      region: 'SIHEUNG' as const,
    }
    expect(toEventCreateRequest(eventCreateSchema.parse(base))).toEqual({
      title: '외국인 주민 한국어 교실',
      description: null,
      venue: null,
      startsOn: '2026-12-18',
      endsOn: null,
      startsAt: null,
      endsAt: null,
      priceInfo: null,
      applicationDeadline: null,
      applicationUrl: null,
      sourceUrl: null,
      region: 'SIHEUNG',
      multicultural: null,
      category: null,
      thumbnailUrl: null,
    })
    const issues = eventCreateSchema.safeParse({
      ...base,
      startsOn: '',
      region: '',
      sourceUrl: 'www.siheung.go.kr',
    }).error?.issues
    expect(issues?.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'admin.events.dateRequired',
        'admin.events.regionRequired',
        'admin.documents.urlInvalid',
      ]),
    )
  })

  it('shows one date when start and end are the same', () => {
    expect(eventPeriod('2026-12-18', '2026-12-18')).toBe('2026-12-18')
    expect(eventPeriod(null, '2026-12-20')).toBe('2026-12-20')
    expect(eventPeriod('2026-12-18', '2026-12-20')).toBe(
      '2026-12-18 ~ 2026-12-20',
    )
  })
})
