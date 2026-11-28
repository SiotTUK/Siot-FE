import { describe, expect, it } from 'vitest'
import { toGuideForm, toGuideRequest } from './guide-form'

describe('guide text form', () => {
  it('starts empty for a language without text', () => {
    expect(toGuideForm(null)).toMatchObject({
      title: '',
      docs: '',
      noticeChanged: false,
    })
  })

  it('sends every field, turning blanks into null and lines into documents', () => {
    expect(
      toGuideRequest({
        ...toGuideForm(null),
        title: '  외국인등록 ',
        place: '   ',
        docs: '여권\n\n 사진 1장 \n',
        noticeChanged: true,
      }),
    ).toEqual({
      title: '외국인등록',
      summary: null,
      content: null,
      badge: null,
      place: null,
      docs: ['여권', '사진 1장'],
      fee: null,
      law: null,
      penalty: null,
      sourceName: null,
      noticeChanged: true,
    })
  })

  it('round-trips saved text and never keeps the "changed" flag on', () => {
    const form = toGuideForm({
      code: 'CL-01',
      language: 'ko',
      title: '외국인등록',
      summary: null,
      content: null,
      badge: '입국 후 90일 이내',
      place: null,
      docs: ['여권', '사진 1장'],
      fee: '30,000원',
      law: null,
      penalty: null,
      sourceName: null,
      noticeChangedAt: '2026-11-14T00:00:00Z',
      updatedAt: '2026-11-14T00:00:00Z',
      pageStart: 12,
      pageEnd: 14,
      sourcePages: 'p.12~14',
      points: [],
      when: null,
      contact: null,
      reviewed: false,
    })
    expect(form.docs).toBe('여권\n사진 1장')
    expect(form.noticeChanged).toBe(false)
  })
})
