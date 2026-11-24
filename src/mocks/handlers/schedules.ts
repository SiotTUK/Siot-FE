import { http, HttpResponse } from 'msw'
import type { ScheduleResponse } from '@/features/calendar/api'
import { isLanguage } from '@/shared/i18n'
import { koreaToday } from '@/shared/i18n/format'
import { currentMember } from '../db'

const titles = {
  ko: ['지역 생활 안내 기간', '체류기간 만료일'],
  en: ['Community information period', 'Stay expiration date'],
  zh: ['社区生活咨询期', '居留期限届满日'],
  vi: ['Thời gian tư vấn sinh hoạt địa phương', 'Ngày hết hạn lưu trú'],
}

export const scheduleHandlers = [
  http.get('*/api/schedules/monthly', ({ request }) => {
    const params = new URL(request.url).searchParams
    const [year, month] = koreaToday().split('-')
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
    if (currentMember()) {
      schedules.push({
        scheduleId: null,
        guideId: null,
        kind: 'STAY_EXPIRY',
        title: personalTitle,
        startsOn: `${period}-18`,
        endsOn: `${period}-18`,
        targetDescription: null,
        sourceUrl: null,
        personal: true,
        highlighted: true,
      })
    }
    return HttpResponse.json({ data: schedules })
  }),
]
