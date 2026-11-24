import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { isLifeChangeCode } from '@/features/life-changes/life-changes'
import { body, currentMember, error, persist, state, unauthorized } from '../db'

const path = '*/api/members/me/life-changes'
const invalidCode = () =>
  error(400, 'INVALID_LIFE_CHANGE_CODE', '올바르지 않은 생활 변화 코드입니다.')

export const lifeChangeHandlers = [
  http.get(path, () => {
    const member = currentMember()
    if (!member) return unauthorized()
    return HttpResponse.json({
      data: Object.values(state.lifeChanges[member.email] ?? {}),
    })
  }),

  http.put(`${path}/:code`, async ({ request, params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const { code } = params
    if (!isLifeChangeCode(code)) return invalidCode()
    const input = await body(request)
    const date = z.iso.date().safeParse(input.baseDate)
    if (!date.success)
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')

    const records = (state.lifeChanges[member.email] ??= {})
    const now = new Date().toISOString()
    const record = {
      lifeChangeCode: code,
      baseDate: date.data,
      createdAt: records[code]?.createdAt ?? now,
      updatedAt: now,
    }
    records[code] = record
    persist()
    return HttpResponse.json({ data: record })
  }),

  http.delete(`${path}/:code`, ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const { code } = params
    if (!isLifeChangeCode(code)) return invalidCode()
    const records = state.lifeChanges[member.email]
    if (!records?.[code])
      return error(
        404,
        'LIFE_CHANGE_NOT_FOUND',
        '생활 변화 기록을 찾을 수 없습니다.',
      )
    delete records[code]
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]
