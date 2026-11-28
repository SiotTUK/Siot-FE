import { describe, expect, it } from 'vitest'
import type { AdminRuleDetail, AdminRuleFaq } from './rule-api'
import {
  ruleCreateSchema,
  ruleFaqFormSchema,
  ruleFormSchema,
  toRuleCreateRequest,
  toRuleFaqForm,
  toRuleFaqRequest,
  toRuleForm,
  toRuleUpdateRequest,
  type RuleFaqForm,
  type RuleForm,
} from './rule-form'

const saved: AdminRuleDetail = {
  code: 'waste-food',
  category: '쓰레기 배출',
  title: '음식물 쓰레기',
  summary: null,
  content: '옛 본문',
  badge: '매일',
  place: null,
  docs: ['전용 봉투'],
  fee: null,
  law: null,
  penalty: null,
  contact: '031-310-2254',
  sourceUrl: 'https://www.siheung.go.kr',
  sourceName: '시흥시',
  sortOrder: 3,
  faq: true,
  noticeChangedAt: null,
  points: ['전용 봉투에 담아요', '물기를 빼요'],
  when: null,
  sources: [{ name: '시흥시', url: 'https://www.siheung.go.kr' }],
  checkedOn: '2026-11-25',
}

const parse = (form: Partial<RuleForm>, schema = ruleFormSchema) =>
  schema.safeParse({ ...toRuleForm(saved), ...form })
const issue = (form: Partial<RuleForm>, schema = ruleFormSchema) =>
  parse(form, schema).error?.issues[0]

describe('rule form', () => {
  it('fills from the saved rule and sends hidden fields back as loaded', () => {
    const form = toRuleForm(saved)
    expect(form).toMatchObject({
      sortOrder: '3',
      points: '전용 봉투에 담아요\n물기를 빼요',
      checkedOn: '2026-11-25',
    })
    const parsed = ruleFormSchema.parse({
      ...form,
      points: ' 전용 봉투에 담아요 \n\n새 문장\n',
      contact: '  ',
      place: ' 집 앞 ',
    })
    expect(toRuleUpdateRequest(parsed, saved, true)).toEqual({
      category: '쓰레기 배출',
      sortOrder: 3,
      faq: true,
      title: '음식물 쓰레기',
      summary: null,
      // Rebuilt by the BE from points, so it never goes stale.
      content: null,
      badge: '매일',
      place: '집 앞',
      docs: ['전용 봉투'],
      fee: null,
      law: null,
      penalty: null,
      // "" clears the contact.
      contact: '',
      sourceName: '시흥시',
      points: ['전용 봉투에 담아요', '새 문장'],
      when: null,
      sources: [{ name: '시흥시', url: 'https://www.siheung.go.kr' }],
      checkedOn: '2026-11-25',
      noticeChanged: true,
    })
  })

  it('creates with a code and empty hidden fields', () => {
    const parsed = ruleCreateSchema.parse({
      ...toRuleForm(null),
      code: ' new-rule ',
      category: '새 분류',
      title: '제목',
      points: '문장',
    })
    expect(toRuleCreateRequest(parsed)).toMatchObject({
      code: 'new-rule',
      sortOrder: 0,
      badge: null,
      docs: [],
      sourceName: null,
      checkedOn: null,
    })
    expect(issue({ code: '' }, ruleCreateSchema)?.message).toBe(
      'admin.rules.codeRequired',
    )
  })

  it('checks required fields, statements, sources and numbers', () => {
    expect(issue({ category: ' ' })?.message).toBe(
      'admin.rules.categoryRequired',
    )
    expect(issue({ title: '' })?.message).toBe('admin.titleRequired')
    expect(issue({ points: '\n \n' })?.message).toBe('admin.rules.pointsLimit')
    expect(
      issue({ points: Array.from({ length: 31 }, (_, i) => `${i}`).join('\n') })
        ?.message,
    ).toBe('admin.rules.pointsLimit')
    expect(issue({ sortOrder: '1.5' })?.message).toBe(
      'admin.rules.sortOrderInvalid',
    )
    expect(
      issue({ sources: [{ name: '시흥시', url: 'www.siheung.go.kr' }] }),
    ).toMatchObject({
      path: ['sources', 0, 'url'],
      message: 'admin.documents.urlInvalid',
    })
    expect(
      issue({ sources: [{ name: ' ', url: 'https://a.kr' }] })?.message,
    ).toBe('admin.rules.sourceNameRequired')
    expect(parse({ sortOrder: '-2', checkedOn: '' }).success).toBe(true)
  })
})

describe('rule FAQ form', () => {
  const faq: AdminRuleFaq = {
    faqId: 1,
    sortOrder: 2,
    ruleCode: 'waste-food',
    ruleTitle: '음식물 쓰레기',
    ruleDeleted: false,
    translations: {
      ko: { question: '언제 버려요?', answer: '매일' },
      en: { question: 'When?', answer: 'Every day' },
    },
  }
  const parseFaq = (form: Partial<RuleFaqForm>) =>
    ruleFaqFormSchema.safeParse({ ...toRuleFaqForm(faq), ...form })

  it('sends Korean and the languages with both question and answer', () => {
    const parsed = ruleFaqFormSchema.parse({
      ...toRuleFaqForm(faq),
      zh: { question: ' 什么时候? ', answer: ' 每天 ' },
    })
    expect(toRuleFaqRequest(parsed)).toEqual({
      sortOrder: 2,
      ruleCode: 'waste-food',
      translations: {
        ko: { question: '언제 버려요?', answer: '매일' },
        en: { question: 'When?', answer: 'Every day' },
        zh: { question: '什么时候?', answer: '每天' },
      },
    })
  })

  it('needs Korean, and both or neither for other languages', () => {
    expect(
      parseFaq({ ko: { question: '', answer: '매일' } }).error?.issues[0],
    ).toMatchObject({ path: ['ko', 'question'] })
    expect(
      parseFaq({ vi: { question: 'Khi nào?', answer: '' } }).error?.issues[0],
    ).toMatchObject({
      path: ['vi', 'answer'],
      message: 'admin.faqs.answerRequired',
    })
  })

  it('starts new FAQs after the last one and drops a deleted rule link', () => {
    expect(toRuleFaqForm(null, 6)).toMatchObject({
      sortOrder: '6',
      ruleCode: '',
    })
    expect(toRuleFaqForm({ ...faq, ruleDeleted: true }).ruleCode).toBe('')
  })
})
