import { http, HttpResponse } from 'msw'
import { eventLeadDays } from '@/features/events/api'
import type {
  EventCalendarItem,
  EventDetail,
  EventRecommendation,
} from '@/features/events/api'
import type { Language } from '@/shared/api/types'
import { koreaToday } from '@/shared/i18n/format'
import { body, currentMember, error, persist, state, unauthorized } from '../db'

const sampleText = {
  ko: {
    titles: [
      '한국어 무료 강좌',
      '가족 과학 체험',
      '다문화 겨울 장터',
      '연말 공연',
    ],
    venues: [
      '시흥시외국인복지센터',
      '해양생태과학관',
      '정왕동 미관광장',
      '시흥ABC행복학습타운',
    ],
    description:
      '지역 주민이 함께 참여할 수 있는 프로그램입니다. 자세한 내용은 원문에서 확인해 주세요.',
    free: '무료',
  },
  en: {
    titles: [
      'Free Korean classes',
      'Family science workshop',
      'Multicultural winter market',
      'Year-end concert',
    ],
    venues: [
      'Siheung Foreign Residents Welfare Center',
      'Marine Ecology Science Museum',
      'Jeongwang Cultural Square',
      'Siheung ABC Learning Town',
    ],
    description:
      'A program for local residents. See the original announcement for details.',
    free: 'Free',
  },
  zh: {
    titles: ['免费韩语课程', '亲子科学体验', '多文化冬季市集', '年终演出'],
    venues: [
      '始兴市外国人福利中心',
      '海洋生态科学馆',
      '正往洞广场',
      '始兴ABC学习城',
    ],
    description: '欢迎当地居民参与。详情请查看原始公告。',
    free: '免费',
  },
  vi: {
    titles: [
      'Lớp tiếng Hàn miễn phí',
      'Trải nghiệm khoa học dành cho gia đình',
      'Chợ mùa đông đa văn hóa',
      'Buổi biểu diễn cuối năm',
    ],
    venues: [
      'Trung tâm Phúc lợi Người nước ngoài Siheung',
      'Bảo tàng Khoa học Sinh thái Biển',
      'Quảng trường Jeongwang',
      'Trung tâm Học tập ABC Siheung',
    ],
    description:
      'Chương trình dành cho cư dân địa phương. Xem thông báo gốc để biết thêm chi tiết.',
    free: 'Miễn phí',
  },
}

export function mockEvents(language: Language) {
  const text = sampleText[language]
  const today = Date.parse(`${koreaToday()}T00:00:00Z`)
  const dateIn = (days: number) =>
    new Date(today + days * 86_400_000).toISOString().slice(0, 10)

  return text.titles.map<EventDetail>((title, index) => ({
    eventId: index + 1,
    title,
    venue: text.venues[index],
    startsOn: dateIn(index === 0 ? -9 : index * 4),
    endsOn: dateIn(index === 0 ? 14 : index * 4 + 12),
    startsAt: index === 1 ? null : '14:00:00',
    endsAt: index === 1 ? null : '16:00:00',
    timeUnknown: index === 1,
    region: 'SIHEUNG',
    multicultural: index === 0 || index === 2,
    language,
    translated: true,
    description: text.description,
    priceInfo: text.free,
    applicationDeadline: null,
    applicationUrl: index === 0 ? 'https://example.org/' : null,
    sourceUrl: 'https://www.siheung.go.kr/',
    subscribed: false,
  }))
}

const subscriptionPath = '*/api/events/:eventId/subscriptions'

function saveSubscription(eventId: string, request: Request, enabled: boolean) {
  const member = currentMember()
  if (!member) return unauthorized()
  const event = mockEvents(member.language).find(
    (item) => String(item.eventId) === eventId,
  )
  if (!event) return error(404, 'EVENT_NOT_FOUND', '행사를 찾을 수 없습니다.')
  const requested = new URL(request.url).searchParams.get('leadDays')
  const selected = eventLeadDays.find((days) => String(days) === requested)
  const lastDay = event.endsOn ?? event.startsOn
  if (
    enabled &&
    ((requested !== null && selected === undefined) ||
      (lastDay && lastDay < koreaToday()))
  ) {
    return error(400, 'INVALID_INPUT', '알림 설정을 다시 확인해 주세요.')
  }
  const subscriptions = (state.eventSubscriptions[member.id] ??= {})
  const leadDays = selected ?? subscriptions[eventId]?.leadDays ?? 1
  subscriptions[eventId] = { enabled, leadDays }
  persist()
  return HttpResponse.json({
    data: {
      eventId: event.eventId,
      userId: member.id,
      enabled,
      leadDays,
      updatedAt: new Date().toISOString(),
    },
  })
}

export const eventHandlers = [
  http.get(subscriptionPath, ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const saved = state.eventSubscriptions[member.id]?.[String(params.eventId)]
    return HttpResponse.json({
      data: {
        subscribed: saved?.enabled ?? false,
        leadDays: saved?.enabled ? saved.leadDays : null,
      },
    })
  }),
  http.post(subscriptionPath, ({ params, request }) =>
    saveSubscription(String(params.eventId), request, true),
  ),
  http.delete(subscriptionPath, ({ params, request }) =>
    saveSubscription(String(params.eventId), request, false),
  ),
  http.get('*/api/events/recommendations', () => {
    const member = currentMember()
    if (!member) return unauthorized()
    const [classes, family, market] = mockEvents(member.language)
    const data: EventRecommendation[] = [
      { event: classes, reasons: ['KOREAN_CLASS', 'SIHEUNG'] },
      { event: market, reasons: ['MULTICULTURAL', 'SIHEUNG'] },
      { event: family, reasons: ['FAMILY_KIDS', 'SIHEUNG'] },
    ]
    return HttpResponse.json({ data })
  }),
  http.get('*/api/events', ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const page = Number(new URL(request.url).searchParams.get('page') ?? '0')
    const events = mockEvents(member.language)
    return HttpResponse.json({
      data: {
        content: page === 0 ? events : [],
        page,
        size: 20,
        totalElements: events.length,
        totalPages: 1,
        hasNext: false,
      },
    })
  }),
  http.get('*/api/events/calendar', ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const params = new URL(request.url).searchParams
    const year = Number(params.get('year'))
    const month = Number(params.get('month'))
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      year < 2000 ||
      year > 2100 ||
      month < 1 ||
      month > 12
    )
      return error(400, 'INVALID_INPUT', '유효한 연도와 월을 입력해 주세요.')

    const first = new Date(Date.UTC(year, month - 1, 1))
      .toISOString()
      .slice(0, 10)
    const last = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
    const data = mockEvents(member.language).flatMap<EventCalendarItem>(
      ({ eventId, title, startsOn, endsOn, region, translated }) => {
        const start = startsOn ?? endsOn
        const end = endsOn ?? startsOn
        return start && end && start <= last && end >= first
          ? [{ eventId, title, startsOn, endsOn, region, translated }]
          : []
      },
    )
    return HttpResponse.json({ data })
  }),
  http.get('*/api/events/:eventId', ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const event = mockEvents(member.language).find(
      (item) => String(item.eventId) === params.eventId,
    )
    return event
      ? HttpResponse.json({
          data: {
            ...event,
            subscribed:
              state.eventSubscriptions[member.id]?.[String(event.eventId)]
                ?.enabled ?? false,
          },
        })
      : error(404, 'EVENT_NOT_FOUND', '행사를 찾을 수 없습니다.')
  }),
  http.post('*/api/reports', async ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const report = await body(request)
    // Same checks as BE ContentReportRequest (COM-01).
    if (
      !['TRANSLATION', 'CONTENT', 'OTHER'].includes(String(report.reason)) ||
      typeof report.quotedText !== 'string' ||
      !report.quotedText.trim() ||
      report.quotedText.length > 2000 ||
      (typeof report.targetTitleSnapshot === 'string' &&
        report.targetTitleSnapshot.length > 255)
    )
      return error(400, 'INVALID_INPUT', '입력값이 올바르지 않습니다.')
    if (
      !mockEvents(member.language).some(
        ({ eventId }) => report.eventId === eventId,
      )
    )
      return error(404, 'EVENT_NOT_FOUND', '행사를 찾을 수 없습니다.')

    return HttpResponse.json(
      { data: { reportId: 1, status: 'RECEIVED' } },
      { status: 201 },
    )
  }),
]
