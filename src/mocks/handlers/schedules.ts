import { http, HttpResponse } from 'msw'
import type { ScheduleResponse } from '@/features/calendar/api'
import { isLanguage } from '@/shared/i18n'
import { koreaToday } from '@/shared/i18n/format'
import { currentMember, unauthorized } from '../db'

const titles = {
  ko: ['지역 생활 안내 기간', '체류기간 만료일'],
  en: ['Community information period', 'Stay expiry date'],
  zh: ['社区生活咨询期', '居留期满日'],
  vi: ['Thời gian tư vấn sinh hoạt địa phương', 'Ngày hết hạn lưu trú'],
}

export const scheduleHandlers = [
  http.get('*/api/schedules/monthly', ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()

    const params = new URL(request.url).searchParams
    const today = koreaToday()
    const [year, month] = today.split('-')
    const requestedMonth = (params.get('month') ?? month).padStart(2, '0')
    const requestedYear = params.get('year') ?? year
    const language = params.get('language')
    const [commonTitle, personalTitle] =
      titles[isLanguage(language) ? language : 'ko']
    const period = `${requestedYear}-${requestedMonth}`
    const schedules: ScheduleResponse[] = [
      {
        scheduleId: 1,
        guideId: null,
        kind: 'LIFE',
        title: commonTitle,
        startsOn: `${period}-05`,
        endsOn: `${period}-10`,
        targetDescription: null,
        sourceUrl: null,
        personal: false,
        highlighted: false,
      },
    ]
    const expiry = member.stayExpiry
    if (expiry?.startsWith(`${period}-`)) {
      const highlightFrom = new Date(`${today}T00:00:00Z`)
      highlightFrom.setUTCDate(highlightFrom.getUTCDate() + 30)
      schedules.push({
        scheduleId: null,
        guideId: null,
        kind: 'STAY_EXPIRY',
        title: personalTitle,
        startsOn: expiry,
        endsOn: expiry,
        targetDescription: null,
        sourceUrl: null,
        personal: true,
        highlighted: expiry <= highlightFrom.toISOString().slice(0, 10),
      })
    }
    return HttpResponse.json({
      data: schedules.sort((first, second) =>
        first.startsOn.localeCompare(second.startsOn),
      ),
    })
  }),
]
