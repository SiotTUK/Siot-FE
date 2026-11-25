import { http, HttpResponse } from 'msw'
import type { EventDetail, EventRecommendation } from '@/features/events/api'
import type { Language } from '@/shared/api/types'
import { koreaToday } from '@/shared/i18n/format'
import { currentMember, error, unauthorized } from '../db'

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

function mockEvents(language: Language) {
  const text = sampleText[language]
  const today = Date.parse(`${koreaToday()}T00:00:00Z`)
  const dateIn = (days: number) =>
    new Date(today + days * 86_400_000).toISOString().slice(0, 10)

  return text.titles.map<EventDetail>((title, index) => ({
    eventId: index + 1,
    title,
    venue: text.venues[index],
    startsOn: dateIn(index === 0 ? -9 : index * 4),
    endsOn: dateIn(index === 0 ? 14 : index * 4),
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

export const eventHandlers = [
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
  http.get('*/api/events/:eventId', ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const event = mockEvents(member.language).find(
      (item) => String(item.eventId) === params.eventId,
    )
    return event
      ? HttpResponse.json({ data: event })
      : error(404, 'EVENT_NOT_FOUND', '행사를 찾을 수 없습니다.')
  }),
]
