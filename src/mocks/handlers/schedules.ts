import { http, HttpResponse } from 'msw'
import type {
  ScheduleResponse,
  TaxDetailResponse,
} from '@/features/calendar/api'
import { isLanguage } from '@/shared/i18n'
import { koreaToday } from '@/shared/i18n/format'
import { currentMember, error, unauthorized } from '../db'

// The common schedule is a tax period like the ones admins enter in the BE
// (calendar_schedule, kind TAX); the BE never sends a kind such as LIFE.
// Its title comes from the linked guide (BE seed 'tax-resident'), because the
// BE uses the raw kind as the title when guideId is null.
const titles = {
  ko: ['주민세 (개인분)', '체류기간 만료일'],
  en: ['Resident tax (individual)', 'Stay expiry date'],
  zh: ['居民税（个人部分）', '居留期满日'],
  vi: ['Thuế cư trú (cá nhân)', 'Ngày hết hạn lưu trú'],
}
/** Mock-only guide id; the FE does not read guideId. */
const residentTaxGuideId = 101

/** Mock CAL-03 detail of the resident tax (BE #29 contact included). */
function residentTaxDetail(language: string | null): TaxDetailResponse {
  const today = koreaToday()
  const period = today.slice(0, 7)
  const endsOn = `${period}-10`
  const dDay = Math.round(
    (Date.parse(`${endsOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86_400_000,
  )
  return {
    scheduleId: 1,
    guideId: residentTaxGuideId,
    kind: 'TAX_RESIDENT',
    title: titles[isLanguage(language) ? language : 'ko'][0],
    startsOn: `${period}-05`,
    endsOn,
    targetDescription: '7월 1일 기준 시흥시에 주소를 둔 세대주',
    sourceUrl: 'https://www.wetax.go.kr',
    summary: '고지서가 오면 기한 안에 위택스나 은행에서 내요.',
    content: null,
    place: '위택스 · 은행 ATM · 가상계좌',
    docs: [],
    fee: '개인분 1만 원 안팎 (지역마다 다름)',
    law: '지방세법 제74조',
    penalty: '기한이 지나면 3% 가산세',
    contact:
      language === 'ko' || !isLanguage(language)
        ? '시흥시 시세관리과 031-310-2089'
        : 'Siheung City Tax Management Division 031-310-2089',
    sourcePages: 'p.45',
    dDay,
  }
}

export const scheduleHandlers = [
  http.get('*/api/schedules/taxes/:scheduleId', ({ params, request }) => {
    if (!currentMember()) return unauthorized()
    if (params.scheduleId !== '1')
      return error(404, 'SCHEDULE_NOT_FOUND', '일정을 찾을 수 없습니다.')
    const language = new URL(request.url).searchParams.get('language')
    return HttpResponse.json({ data: residentTaxDetail(language) })
  }),
  http.get('*/api/schedules/taxes', ({ request }) => {
    if (!currentMember()) return unauthorized()
    const params = new URL(request.url).searchParams
    const kind = params.get('kind')
    const detail = residentTaxDetail(params.get('language'))
    // Only the resident tax has a common schedule in the mock; other kinds are
    // empty, as on a BE without common tax schedules yet.
    return HttpResponse.json({
      data: !kind || kind === detail.kind ? [detail] : [],
    })
  }),
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
      // Shown on the 5th–10th of every month so a common schedule is always
      // visible in the mock; the real resident tax period is 16–31 August.
      {
        scheduleId: 1,
        guideId: residentTaxGuideId,
        kind: 'TAX',
        title: commonTitle,
        startsOn: `${period}-05`,
        endsOn: `${period}-10`,
        targetDescription: null,
        sourceUrl: null,
        personal: false,
        highlighted: false,
        taxScheduleId: 1,
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
        taxScheduleId: null,
      })
    }
    return HttpResponse.json({
      data: schedules.sort((first, second) =>
        first.startsOn.localeCompare(second.startsOn),
      ),
    })
  }),
]
