import { describe, expect, it } from 'vitest'
import type { GuideInfoResponse } from './api'
import {
  guideInfoFormSchema,
  toGuideInfoForm,
  toGuideInfoRequest,
  type GuideInfoForm,
} from './guide-info-form'

const saved: GuideInfoResponse = {
  code: 'CL-01',
  kind: 'CHECKLIST',
  sourceUrl: 'https://www.hikorea.go.kr',
  contact: null,
  updatedAt: null,
}
const parse = (form: Partial<GuideInfoForm>) =>
  guideInfoFormSchema.safeParse({ ...toGuideInfoForm(saved), ...form })
const request = (form: Partial<GuideInfoForm>) => {
  const parsed = parse(form)
  if (!parsed.success) throw parsed.error
  return toGuideInfoRequest(parsed.data, saved)
}

describe('guide source link and contact form', () => {
  it('starts with the saved values, null as empty', () => {
    expect(toGuideInfoForm(saved)).toEqual({
      sourceUrl: 'https://www.hikorea.go.kr',
      contact: '',
    })
  })

  it('sends only changed fields, and "" to clear one', () => {
    expect(request({})).toEqual({})
    expect(request({ sourceUrl: ' https://www.hikorea.go.kr ' })).toEqual({})
    expect(request({ contact: ' 031-310-2114 ' })).toEqual({
      contact: '031-310-2114',
    })
    expect(request({ sourceUrl: '   ' })).toEqual({ sourceUrl: '' })
    expect(
      request({ sourceUrl: 'https://www.hikorea.go.kr/info', contact: '1345' }),
    ).toEqual({ sourceUrl: 'https://www.hikorea.go.kr/info', contact: '1345' })
  })

  it('checks the link format and lengths', () => {
    expect(
      parse({ sourceUrl: 'www.hikorea.go.kr' }).error?.issues[0],
    ).toMatchObject({
      path: ['sourceUrl'],
      message: 'admin.documents.urlInvalid',
    })
    expect(parse({ sourceUrl: 'https://a.kr/x y' }).success).toBe(false)
    expect(parse({ sourceUrl: '' }).success).toBe(true)
    expect(parse({ contact: '1'.repeat(256) }).error?.issues[0]?.message).toBe(
      'admin.tooLong',
    )
  })
})
