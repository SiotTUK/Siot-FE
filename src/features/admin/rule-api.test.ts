import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, logout } from '@/features/auth/api'
import {
  createRule,
  createRuleFaq,
  deleteRule,
  deleteRuleFaq,
  fetchAdminRule,
  fetchAdminRules,
  fetchRuleCategories,
  fetchRuleFaqs,
  renameRuleCategory,
  saveRuleCategoryTranslation,
  updateRule,
  updateRuleFaq,
  type RuleCreateRequest,
} from './rule-api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
const admin = { email: 'admin@example.com', password: 'admin1234' }
const member = { email: 'taken@example.com', password: 'abcd1234' }
const all = { category: '', keyword: '', includeDeleted: false }

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      interceptedFetch(
        typeof input === 'string' ? new URL(input, origin) : input,
        init,
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

const newRule: RuleCreateRequest = {
  code: 'test-rule',
  category: '새 분류',
  sortOrder: 1,
  faq: false,
  title: '테스트 수칙',
  summary: null,
  content: null,
  badge: null,
  place: null,
  docs: [],
  fee: null,
  law: null,
  penalty: null,
  contact: '',
  sourceName: null,
  points: ['첫 문장'],
  when: null,
  sources: [{ name: '시흥시', url: 'https://www.siheung.go.kr' }],
  checkedOn: '2026-11-28',
}

describe('ADM-06 admin rules', () => {
  it('is for admins only', async () => {
    await login(member)
    await expect(fetchAdminRules(all)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
    await expect(fetchRuleFaqs()).rejects.toMatchObject({ status: 403 })
    await logout()
  })

  it('creates, reads, updates, filters and soft-deletes a rule', async () => {
    await login(admin)
    const created = await createRule(newRule)
    expect(created).toMatchObject({
      code: 'test-rule',
      content: '첫 문장',
      sourceUrl: 'https://www.siheung.go.kr',
    })
    await expect(createRule(newRule)).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_GUIDE_CODE',
    })

    const updated = await updateRule('test-rule', {
      ...newRule,
      title: '바뀐 제목',
      points: ['새 문장', '둘째'],
      noticeChanged: true,
    })
    expect(updated).toMatchObject({
      title: '바뀐 제목',
      content: '새 문장\n둘째',
    })
    expect(updated.noticeChangedAt).not.toBeNull()
    await expect(fetchAdminRule('test-rule')).resolves.toMatchObject({
      points: ['새 문장', '둘째'],
    })

    await expect(
      fetchAdminRules({ ...all, category: '새 분류' }),
    ).resolves.toEqual([expect.objectContaining({ code: 'test-rule' })])
    await expect(
      fetchAdminRules({ ...all, keyword: '바뀐' }),
    ).resolves.toHaveLength(1)

    await deleteRule('test-rule')
    await expect(
      fetchAdminRules({ ...all, keyword: 'test-rule' }),
    ).resolves.toEqual([])
    await expect(
      fetchAdminRules({ ...all, keyword: 'test-rule', includeDeleted: true }),
    ).resolves.toEqual([expect.objectContaining({ deleted: true })])
    // Deleted rules can be read, not changed; their code cannot be reused.
    await expect(fetchAdminRule('test-rule')).resolves.toMatchObject({
      title: '바뀐 제목',
    })
    await expect(
      updateRule('test-rule', { ...newRule, noticeChanged: false }),
    ).rejects.toMatchObject({ status: 404, code: 'GUIDE_NOT_FOUND' })
    await expect(createRule(newRule)).rejects.toMatchObject({ status: 409 })
    await expect(fetchAdminRule('no-such')).rejects.toMatchObject({
      status: 404,
    })
  })

  it('rejects a rule without statements or with a bad source link', async () => {
    await login(admin)
    await expect(
      createRule({ ...newRule, code: 'x', points: [] }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_INPUT' })
    await expect(
      createRule({
        ...newRule,
        code: 'x',
        sources: [{ name: 'a', url: 'ftp://a' }],
      }),
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('RUL-12·13 categories', () => {
  it('lists, renames (moving rules) and fixes translations', async () => {
    await login(admin)
    const before = await fetchRuleCategories()
    const waste = before.find((item) => item.category === '쓰레기 배출')
    expect(waste).toMatchObject({ translations: { en: expect.any(String) } })

    await expect(
      saveRuleCategoryTranslation('쓰레기 배출', 'en', 'Waste disposal'),
    ).resolves.toMatchObject({ translations: { en: 'Waste disposal' } })

    const renamed = await renameRuleCategory('쓰레기 배출', '생활 쓰레기')
    expect(renamed.ruleCount).toBe(waste?.ruleCount)
    await expect(
      fetchAdminRules({ ...all, category: '쓰레기 배출' }),
    ).resolves.toEqual([])
    await expect(
      renameRuleCategory('없는 분류', '새 이름'),
    ).rejects.toMatchObject({ status: 404, code: 'RULE_CATEGORY_NOT_FOUND' })
  })
})

describe('RUL-04 FAQs', () => {
  it('creates, replaces languages, unlinks and deletes', async () => {
    await login(admin)
    const before = await fetchRuleFaqs()
    const faq = await createRuleFaq({
      sortOrder: 0,
      ruleCode: 'waste-food',
      translations: {
        ko: { question: '질문', answer: '답' },
        en: { question: 'Q', answer: 'A' },
      },
    })
    expect(faq).toMatchObject({ ruleCode: 'waste-food', ruleDeleted: false })
    await expect(fetchRuleFaqs()).resolves.toHaveLength(before.length + 1)
    expect((await fetchRuleFaqs())[0]?.faqId).toBe(faq.faqId)

    const updated = await updateRuleFaq(faq.faqId, {
      sortOrder: 0,
      ruleCode: '',
      translations: { ko: { question: '바뀐 질문', answer: '답' } },
    })
    expect(updated).toMatchObject({ ruleCode: null })
    expect(updated.translations.en).toBeUndefined()

    await expect(
      createRuleFaq({
        sortOrder: 1,
        ruleCode: '',
        translations: { ko: { question: '', answer: '답' } },
      }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      createRuleFaq({
        sortOrder: 1,
        ruleCode: 'no-such',
        translations: { ko: { question: 'Q', answer: 'A' } },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'GUIDE_NOT_FOUND' })

    await deleteRuleFaq(faq.faqId)
    await expect(deleteRuleFaq(faq.faqId)).rejects.toMatchObject({
      status: 404,
      code: 'RULE_FAQ_NOT_FOUND',
    })
  })
})
