import { http, HttpResponse } from 'msw'
import type { GuideSummaryResponse } from '@/features/admin/api'
import type { ChecklistItemResponse } from '@/features/checklist/api'
import type { LifeChangeCode } from '@/features/life-changes/life-changes'
import {
  body,
  currentMember,
  error,
  persist,
  state,
  unauthorized,
  type MockMember,
} from '../db'

const day = 24 * 60 * 60 * 1000
const isoIn = (days: number) =>
  new Date(Date.now() + days * day).toISOString().slice(0, 10)
const daysUntil = (date: string) =>
  Math.ceil((Date.parse(`${date}T00:00:00`) - Date.now()) / day)

type Seed = Pick<ChecklistItemResponse, 'code' | 'title' | 'itemType'> &
  Partial<ChecklistItemResponse>

/**
 * A small slice of the checklist rules, driven by the member's onboarding
 * answers. Dev/test only: the real deadlines are computed by the BE.
 */
function seeds(member: MockMember): Seed[] {
  const list: Seed[] = []
  const isNew = member.userType === 'NEW'
  const f4 = member.residences.includes('F4')
  if (isNew)
    list.push({
      code: f4 ? 'CL-02' : 'CL-01',
      title: f4 ? '국내거소신고' : '외국인등록',
      itemType: 'REQUIRED',
      badge: '입국 후 90일 이내',
      summary:
        '안산출입국·외국인사무소 (하이코리아 예약) · 이때 시흥 주소도 함께 신고',
      place: '안산출입국·외국인사무소',
      docs: ['여권', '신청서', '컬러 증명사진 1장', '체류지 입증 서류'],
      fee: '30,000원',
      penalty: '기한 초과 시 출입국관리법에 따라 과태료가 부과돼요.',
      contact: '1345',
      sourceUrl: 'https://www.hikorea.go.kr',
      sourceName: '하이코리아 방문 예약',
      content:
        '대한민국에 90일을 초과하여 체류하려는 외국인은 입국한 날부터 90일 이내에 체류지 관할 출입국·외국인관서에 등록해야 합니다.',
      guideId: 1,
      category: 'IMMIGRATION',
      noticeChangedAt: '2026-11-03T09:00:00Z',
      hasNoticeChanged: true,
      law: f4 ? '재외동포법 제6조' : '출입국관리법 제31조',
      deadline: isoIn(5),
    })
  if (member.stayExpiry)
    list.push({
      code: 'CL-05',
      title: '체류기간 연장',
      itemType: 'REQUIRED',
      category: 'IMMIGRATION',
      badge: '만료 4개월 전부터',
      summary: '재학증명서 등 준비 · 하이코리아 예약 후 안산출입국',
      law: '출입국관리법 제25조',
      deadline: member.stayExpiry,
      applyStartsOn: member.stayExpiry,
    })
  list.push({
    code: 'CL-04',
    title: '건강보험 가입 확인',
    itemType: 'REQUIRED',
    category: 'HEALTH_INSURANCE',
    badge: '조건별',
    variantBodies: [
      '고용허가제로 온 근로자는 입국일부터 가입돼요. 그 밖의 회사원은 회사가 직장보험에 가입해 줘요.',
    ],
    law: '국민건강보험법 제109조',
  })
  // No deadline, so dDay and dDayText stay null like the BE sends them.
  const byPurpose: Record<string, Seed> = {
    STUDY: {
      code: 'CL-06',
      title: '아르바이트 전 시간제 취업 허가',
      itemType: 'REQUIRED',
    },
    WORK: {
      code: 'CL-07',
      title: '직장을 바꿀 때 절차 알아두기',
      itemType: 'REQUIRED',
    },
    FAMILY: {
      code: 'CL-08',
      title: '가족센터 프로그램 보기',
      itemType: 'REQUIRED',
    },
    OTHER: {
      code: 'CL-09',
      title: '체류·취업 업종 상담 (☎1345)',
      itemType: 'REQUIRED',
    },
  }
  list.push({ badge: '목적별', ...byPurpose[member.purpose ?? 'OTHER'] })
  if (member.residences.includes('CAR'))
    list.push({
      code: 'CL-10',
      title: '자동차세 내기',
      itemType: 'REQUIRED',
      badge: '거주 정보',
      deadline: isoIn(-2),
      periodKey: '2026-12',
    })
  if (isNew)
    list.push(
      { code: 'CL-20', title: '휴대폰 개통', itemType: 'OPTIONAL' },
      { code: 'CL-21', title: '은행 계좌 만들기', itemType: 'OPTIONAL' },
      {
        code: 'CL-22',
        title: '쓰레기 분리배출 요일 확인',
        itemType: 'OPTIONAL',
      },
    )
  return list
}

/** Titles, deadlines and BE seed categories (V2026_11_14_0430) per life change. */
const changeTasks: Record<
  LifeChangeCode,
  { title: string; days?: number; category?: string }[]
> = {
  'LC-01': [
    { title: '체류지 변경 신고', days: 15 },
    { title: '거소 이전 신고', days: 14 },
    { title: '자동차 주소 변경', days: 30, category: 'CAR' },
    { title: '자녀 전학 안내', category: 'EDUCATION' },
    { title: '쓰레기 배출 요일 확인' },
  ],
  'LC-02': [
    { title: '고용센터 사업장 변경' },
    { title: '근무처 변경 신고', days: 15 },
    { title: '시간제 취업 허가' },
    { title: '건강보험 직장 변경' },
  ],
  'LC-03': [{ title: '학교 입학 신청', category: 'EDUCATION' }],
  'LC-04': [
    { title: '중고차 이전등록', days: 15, category: 'CAR' },
    { title: '자동차보험 가입', category: 'CAR' },
  ],
  'LC-05': [{ title: '아기 체류자격 신청', days: 90 }],
  'LC-06': [{ title: '가족 외국인등록', days: 90 }],
  'LC-07': [{ title: '재입국허가 확인' }],
  'LC-08': [{ title: '외국인등록사항 변경 신고', days: 15 }],
}

/**
 * CHK-06 admin item list (`GET /api/admin/guides`): every checklist item
 * and life change task the mock knows, in BE order. Dev/test only.
 */
export function mockGuideSummaries(): GuideSummaryResponse[] {
  const checklist: [string, string][] = [
    ['CL-01', '외국인등록'],
    ['CL-02', '국내거소신고'],
    ['CL-04', '건강보험 가입 확인'],
    ['CL-05', '체류기간 연장'],
    ['CL-06', '아르바이트 전 시간제 취업 허가'],
    ['CL-07', '직장을 바꿀 때 절차 알아두기'],
    ['CL-08', '가족센터 프로그램 보기'],
    ['CL-09', '체류·취업 업종 상담 (☎1345)'],
    ['CL-10', '자동차세 내기'],
    ['CL-20', '휴대폰 개통'],
    ['CL-21', '은행 계좌 만들기'],
    ['CL-22', '쓰레기 분리배출 요일 확인'],
  ]
  return [
    ...checklist.map(([code, title]) => ({
      code,
      kind: 'CHECKLIST' as const,
      title,
      category: null,
      lifeChangeCode: null,
    })),
    ...Object.entries(changeTasks).flatMap(([lifeChangeCode, tasks]) =>
      tasks.map(({ title, category }, index) => ({
        code: `${lifeChangeCode}-${index + 1}`,
        kind: 'LIFE_CHANGE_TASK' as const,
        title,
        category: category ?? null,
        lifeChangeCode,
      })),
    ),
  ]
}

function changeSeeds(member: MockMember): Seed[] {
  return Object.values(state.lifeChanges[member.email] ?? {}).flatMap(
    ({ lifeChangeCode, baseDate }) =>
      changeTasks[lifeChangeCode].flatMap(
        ({ title, days, category }, index) => {
          const code = `${lifeChangeCode}-${index + 1}`
          const f4 = member.residences.includes('F4')
          if (
            (code === 'LC-01-1' && f4) ||
            (code === 'LC-01-2' && !f4) ||
            (code === 'LC-01-3' && !member.residences.includes('CAR')) ||
            (code === 'LC-01-4' && !member.residences.includes('KIDS')) ||
            ((code === 'LC-02-1' || code === 'LC-02-2') &&
              member.purpose !== 'WORK') ||
            (code === 'LC-02-3' && member.purpose !== 'STUDY')
          )
            return []
          return [
            {
              code,
              title,
              itemType: 'REQUIRED',
              kind: 'LIFE_CHANGE_TASK',
              category: category ?? null,
              periodKey: baseDate,
              deadline:
                days === undefined
                  ? null
                  : new Date(Date.parse(baseDate) + days * day)
                      .toISOString()
                      .slice(0, 10),
            },
          ]
        },
      ),
  )
}

/**
 * BE `ChecklistDisplayReason` (#42): why an item shows, from the onboarding
 * answer its display rule checks above. Common items have none.
 */
const reasonOfCode: Record<string, string> = {
  'CL-05': 'STAY_EXPIRY',
  'LC-01-2': 'F4',
  'LC-01-3': 'CAR',
  'LC-01-4': 'KIDS',
  'LC-02-1': 'PURPOSE_WORK',
  'LC-02-2': 'PURPOSE_WORK',
  'LC-02-3': 'PURPOSE_STUDY',
}

const reasonLabels: Record<string, Record<MockMember['language'], string>> = {
  CAR: {
    ko: '자차가 있어서',
    en: 'Because you own a vehicle',
    zh: '因为您有自己的车',
    vi: 'Vì bạn có xe riêng',
  },
  KIDS: {
    ko: '자녀가 있어서',
    en: 'Because you have children',
    zh: '因为您有子女',
    vi: 'Vì bạn có con',
  },
  F4: {
    ko: '재외동포(F-4)라서',
    en: 'Because you are an overseas Korean (F-4)',
    zh: '因为您是在外同胞（F-4）',
    vi: 'Vì bạn là kiều bào (F-4)',
  },
  STAY_EXPIRY: {
    ko: '체류 만료일을 입력해서',
    en: 'Because you entered your stay expiry date',
    zh: '因为您填写了滞留到期日',
    vi: 'Vì bạn đã nhập ngày hết hạn lưu trú',
  },
  PURPOSE_STUDY: {
    ko: '공부하러 와서',
    en: 'Because you came to study',
    zh: '因为您来学习',
    vi: 'Vì bạn đến để học',
  },
  PURPOSE_WORK: {
    ko: '일하러 와서',
    en: 'Because you came to work',
    zh: '因为您来工作',
    vi: 'Vì bạn đến để làm việc',
  },
}

/** BE `ChecklistCategories`: category names in the member's language. */
const categoryLabels: Record<string, Record<MockMember['language'], string>> = {
  IMMIGRATION: {
    ko: '출입국·체류',
    en: 'Immigration & stay',
    zh: '出入境·居留',
    vi: 'Xuất nhập cảnh & lưu trú',
  },
  HEALTH_INSURANCE: {
    ko: '건강보험',
    en: 'Health insurance',
    zh: '健康保险',
    vi: 'Bảo hiểm y tế',
  },
  FAMILY: { ko: '가족', en: 'Family', zh: '家庭', vi: 'Gia đình' },
  TAX: { ko: '세금', en: 'Tax', zh: '税金', vi: 'Thuế' },
  EDUCATION: { ko: '교육', en: 'Education', zh: '教育', vi: 'Giáo dục' },
  SETTLING: {
    ko: '생활 정착',
    en: 'Settling in',
    zh: '生活适应',
    vi: 'Ổn định cuộc sống',
  },
  CAR: { ko: '자동차', en: 'Car', zh: '汽车', vi: 'Ô tô' },
  EMPLOYMENT: { ko: '취업', en: 'Employment', zh: '就业', vi: 'Việc làm' },
}

/** BE `ChecklistWarning` messages (CHK-08), in the member's language. */
const warningMessages = {
  OVERDUE: {
    ko: '마감 기한이 초과되었습니다. 즉시 확인 후 조치하세요.',
    en: 'The deadline has passed. Please check and take action right away.',
    zh: '已超过截止期限。请立即确认并处理。',
    vi: 'Đã quá hạn. Vui lòng kiểm tra và xử lý ngay.',
  },
  REGISTRATION_DUE: {
    ko: '외국인등록 기한이 30일 이내로 임박했습니다. 기한 초과 시 과태료 및 불이익이 발생합니다.',
    en: 'Your foreigner registration deadline is within 30 days. Missing it can lead to a fine and other disadvantages.',
    zh: '外国人登录期限已不足30天。逾期将被处以罚款并可能产生其他不利影响。',
    vi: 'Hạn đăng ký người nước ngoài còn dưới 30 ngày. Quá hạn có thể bị phạt tiền và chịu bất lợi khác.',
  },
  RESIDENCE_REPORT_DUE: {
    ko: '체류지 변경 신고 마감(전입 후 15일 이내) 기한이 7일 이내로 임박했습니다. 기한 초과 시 과태료가 부과됩니다.',
    en: 'The deadline to report your change of residence (within 15 days of moving) is within 7 days. Missing it results in a fine.',
    zh: '居留地变更申报期限（迁入后15日内）已不足7天。逾期将被处以罚款。',
    vi: 'Hạn khai báo thay đổi nơi cư trú (trong vòng 15 ngày sau khi chuyển đến) còn dưới 7 ngày. Quá hạn sẽ bị phạt tiền.',
  },
} as const

/**
 * Same rule as the BE ChecklistService (CHK-08). Like the BE, a completed
 * CL-01·CL-02 within 30 days still gets REGISTRATION_DUE.
 */
function warningOf(
  code: string,
  status: ChecklistItemResponse['status'],
  dDay: number | null,
): keyof typeof warningMessages | null {
  if (status === 'OVERDUE') return 'OVERDUE'
  if ((code === 'CL-01' || code === 'CL-02') && dDay !== null && dDay <= 30)
    return 'REGISTRATION_DUE'
  if (code === 'LC-01-1' && dDay !== null && dDay <= 7)
    return 'RESIDENCE_REPORT_DUE'
  return null
}

/** An admin's PATCH /api/admin/guides/{code} (only the changed fields). */
function guideInfoOverride(code: string) {
  const info = state.guideInfo?.[code]
  if (!info) return {}
  return {
    ...('sourceUrl' in info && { sourceUrl: info.sourceUrl ?? null }),
    ...('contact' in info && { contact: info.contact ?? null }),
  }
}

function items(member: MockMember): ChecklistItemResponse[] {
  const marks = state.checklist[member.email] ?? {}
  const allSeeds = [...seeds(member), ...changeSeeds(member)]
  const list = allSeeds.map((seed): ChecklistItemResponse => {
    const periodKey = seed.periodKey ?? ''
    const dDay = seed.deadline ? daysUntil(seed.deadline) : null
    const mark = marks[`${seed.code}:${periodKey}`]
    const status = mark ?? (dDay !== null && dDay < 0 ? 'OVERDUE' : 'TODO')
    const warningType = warningOf(seed.code, status, dDay)
    return {
      kind: 'CHECKLIST',
      badge: null,
      place: null,
      docs: [],
      fee: null,
      law: null,
      penalty: null,
      contact: null,
      sourceUrl: null,
      sourceName: null,
      summary: null,
      content: null,
      variantBodies: [],
      deadline: null,
      dDayText:
        dDay === null
          ? null
          : dDay < 0
            ? '기한 지남'
            : dDay === 0
              ? 'D-Day'
              : `D-${dDay}`,
      noticeChangedAt: null,
      hasNoticeChanged: false,
      applyStartsOn: null,
      // BE seed has Korean text only (BE #30): other languages fall back to it.
      contentLanguage: 'ko',
      translated: member.language === 'ko',
      ...seed,
      ...guideInfoOverride(seed.code),
      reason: reasonOfCode[seed.code] ?? null,
      reasonLabel: reasonOfCode[seed.code]
        ? (reasonLabels[reasonOfCode[seed.code]]?.[member.language] ?? null)
        : null,
      // Like the BE: unknown category → the code, none → null.
      categoryLabel: seed.category
        ? (categoryLabels[seed.category]?.[member.language] ?? seed.category)
        : null,
      highlighted: seed.code === 'CL-05' && dDay !== null && dDay <= 30,
      periodKey,
      dDay,
      status,
      completed: status === 'DONE',
      warning: warningType !== null,
      warningType,
      warningMessage: warningType
        ? warningMessages[warningType][member.language]
        : null,
    }
  })
  // Same order as the BE ChecklistService: completed last, then items without
  // a deadline, then nearest deadline first (stable for ties).
  return list.sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      Number(a.deadline === null) - Number(b.deadline === null) ||
      (a.deadline ?? '').localeCompare(b.deadline ?? ''),
  )
}

export const checklistHandlers = [
  http.get('*/api/members/me/checklist', () => {
    const member = currentMember()
    if (!member) return unauthorized()
    const list = items(member)
    const required = list.filter((item) => item.itemType === 'REQUIRED')
    const done = required.filter((item) => item.status === 'DONE').length
    return HttpResponse.json({
      data: {
        totalRequiredCount: required.length,
        completedRequiredCount: done,
        progressPercentage: required.length
          ? Math.round((done / required.length) * 100)
          : 0,
        items: list,
      },
    })
  }),

  http.put('*/api/members/me/checklist/:code', async ({ request, params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const code = String(params.code)
    if (!items(member).some((item) => item.code === code))
      return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    const input = await body(request)
    const status = input.status ?? null
    if (status !== null && status !== 'DONE' && status !== 'NOT_APPLICABLE')
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    const key = `${code}:${typeof input.periodKey === 'string' ? input.periodKey : ''}`
    const marks = (state.checklist[member.email] ??= {})
    if (status) marks[key] = status
    else delete marks[key]
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]
