import { http, HttpResponse } from 'msw'
import type { ScheduleResponse } from '@/features/calendar/api'
import { isLanguage } from '@/shared/i18n'
import { koreaToday } from '@/shared/i18n/format'
import { currentMember, unauthorized } from '../db'

// The common schedule is a tax period like the ones admins enter in the BE
// (calendar_schedule, kind TAX); the BE never sends a kind such as LIFE.
const titles = {
  ko: ['주민세(개인분) 납부', '체류기간 만료일'],
  en: ['Resident tax payment', 'Stay expiry date'],
  zh: ['居民税缴纳', '居留期满日'],
  vi: ['Nộp thuế cư trú', 'Ngày hết hạn lưu trú'],
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
        kind: 'TAX',
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
