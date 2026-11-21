import { http, HttpResponse } from 'msw'
import type { ChecklistItemResponse } from '@/features/checklist/api'
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
      law: f4 ? '재외동포법 제6조' : '출입국관리법 제31조',
      deadline: isoIn(5),
    })
  if (member.stayExpiry)
    list.push({
      code: 'CL-05',
      title: '체류기간 연장',
      itemType: 'REQUIRED',
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
    badge: '조건별',
    dDayText: '조건 확인',
    variantBodies: [
      '고용허가제로 온 근로자는 입국일부터 가입돼요. 그 밖의 회사원은 회사가 직장보험에 가입해 줘요.',
    ],
    law: '국민건강보험법 제109조',
  })
  const byPurpose: Record<string, Seed> = {
    STUDY: {
      code: 'CL-06',
      title: '아르바이트 전 시간제 취업 허가',
      itemType: 'REQUIRED',
      dDayText: '일하기 전',
    },
    WORK: {
      code: 'CL-07',
      title: '직장을 바꿀 때 절차 알아두기',
      itemType: 'REQUIRED',
      dDayText: '바꿀 때',
    },
    FAMILY: {
      code: 'CL-08',
      title: '가족센터 프로그램 보기',
      itemType: 'REQUIRED',
      dDayText: '언제든',
    },
    OTHER: {
      code: 'CL-09',
      title: '체류·취업 업종 상담 (☎1345)',
      itemType: 'REQUIRED',
      dDayText: '언제든',
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

function items(member: MockMember): ChecklistItemResponse[] {
  const marks = state.checklist[member.email] ?? {}
  const list = seeds(member).map((seed): ChecklistItemResponse => {
    const periodKey = seed.periodKey ?? ''
    const dDay = seed.deadline ? daysUntil(seed.deadline) : null
    const mark = marks[`${seed.code}:${periodKey}`]
    const status = mark ?? (dDay !== null && dDay < 0 ? 'OVERDUE' : 'TODO')
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
      ...seed,
      highlighted: seed.code === 'CL-05' && dDay !== null && dDay <= 30,
      periodKey,
      dDay,
      status,
      completed: status === 'DONE',
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
