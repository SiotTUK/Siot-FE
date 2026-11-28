import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, logout } from '@/features/auth/api'
import {
  askQuestion,
  createConversation,
  sendFeedback,
} from '@/features/chat/api'
import {
  changeRole,
  fetchGuideInfo,
  fetchGuideTranslation,
  fetchReviews,
  saveGuideTranslation,
  searchMembers,
  updateGuideInfo,
  updateReview,
} from './api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
const admin = { email: 'admin@example.com', password: 'admin1234' }
const member = { email: 'taken@example.com', password: 'abcd1234' }

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

describe('admin access', () => {
  it('rejects regular members with 403 and visitors with 401', async () => {
    await expect(searchMembers('', '', 0)).rejects.toMatchObject({
      status: 401,
    })
    await login(member)
    await expect(searchMembers('', '', 0)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
  })
})

describe('ADM-01 members', () => {
  it('searches, promotes and blocks self-demotion', async () => {
    const me = await login(admin)
    const found = await searchMembers('taken', '', 0)
    expect(found.content).toEqual([
      expect.objectContaining({ email: 'taken@example.com', role: 'USER' }),
    ])
    const target = found.content[0]!
    await expect(changeRole(target.id, 'ADMIN')).resolves.toMatchObject({
      role: 'ADMIN',
    })
    await expect(searchMembers('', 'ADMIN', 0)).resolves.toMatchObject({
      totalElements: 2,
    })
    await expect(changeRole(me.id, 'USER')).rejects.toMatchObject({
      code: 'ADMIN_SELF_DEMOTION',
    })
    await expect(changeRole(9999, 'ADMIN')).rejects.toMatchObject({
      status: 404,
      code: 'MEMBER_NOT_FOUND',
    })
  })
})

describe('ADM-08 chat reviews', () => {
  it('lists unhelpful answers and records the review', async () => {
    await login(member)
    const { conversationId } = await createConversation('ko')
    const asked = await askQuestion(conversationId, '외국인등록은 어디서 해요?')
    await sendFeedback(conversationId, asked.answer.messageId, false)
    await logout()

    await login(admin)
    const open = await fetchReviews('NEGATIVE', false, 0)
    expect(
      open.content.find((row) => row.messageId === asked.answer.messageId),
    ).toMatchObject({
      reason: 'NEGATIVE',
      question: '외국인등록은 어디서 해요?',
      reviewed: false,
    })
    await updateReview(asked.answer.messageId, {
      reviewed: true,
      adminMemo: '자료 보충함',
    })
    const stillOpen = await fetchReviews('ALL', false, 0)
    expect(stillOpen.content.map((row) => row.messageId)).not.toContain(
      asked.answer.messageId,
    )
    const done = await fetchReviews('ALL', true, 0)
    expect(
      done.content.find((row) => row.messageId === asked.answer.messageId),
    ).toMatchObject({ reviewed: true, adminMemo: '자료 보충함' })
  })
})

describe('CHK-06 guide text', () => {
  it('reads, overwrites and creates a language', async () => {
    await login(admin)
    await expect(fetchGuideTranslation('CL-01', 'ko')).resolves.toMatchObject({
      title: '외국인등록',
    })
    await expect(fetchGuideTranslation('CL-01', 'vi')).rejects.toMatchObject({
      status: 404,
      code: 'GUIDE_TRANSLATION_NOT_FOUND',
    })
    await expect(fetchGuideTranslation('XX-99', 'ko')).rejects.toMatchObject({
      code: 'GUIDE_NOT_FOUND',
    })

    const saved = await saveGuideTranslation('CL-01', 'vi', {
      title: 'Đăng ký người nước ngoài',
      summary: null,
      content: null,
      badge: null,
      place: null,
      docs: ['Hộ chiếu'],
      fee: null,
      law: null,
      penalty: null,
      sourceName: null,
      noticeChanged: true,
    })
    expect(saved).toMatchObject({ language: 'vi', docs: ['Hộ chiếu'] })
    expect(saved.noticeChangedAt).not.toBeNull()
  })

  it('reads and changes the source link and contact: omitted stays, "" clears', async () => {
    await login(member)
    await expect(fetchGuideInfo('CL-01')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
    await expect(
      updateGuideInfo('CL-01', { contact: '1345' }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
    await logout()

    await login(admin)
    await expect(fetchGuideInfo('CL-01')).resolves.toMatchObject({
      code: 'CL-01',
      kind: 'CHECKLIST',
      sourceUrl: 'https://www.hikorea.go.kr',
      contact: '1345',
    })
    await expect(
      updateGuideInfo('CL-01', {
        sourceUrl: ' https://www.hikorea.go.kr/info ',
      }),
    ).resolves.toMatchObject({
      sourceUrl: 'https://www.hikorea.go.kr/info',
      contact: '1345',
    })
    await updateGuideInfo('CL-01', { contact: '' })
    await expect(fetchGuideInfo('CL-01')).resolves.toMatchObject({
      sourceUrl: 'https://www.hikorea.go.kr/info',
      contact: null,
    })
    await expect(
      updateGuideInfo('CL-01', { sourceUrl: 'www.hikorea.go.kr' }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_INPUT' })
    await expect(fetchGuideInfo('XX-99')).rejects.toMatchObject({
      status: 404,
      code: 'GUIDE_NOT_FOUND',
    })
    await expect(
      updateGuideInfo('XX-99', { contact: '1345' }),
    ).rejects.toMatchObject({ status: 404, code: 'GUIDE_NOT_FOUND' })
    await expect(fetchGuideInfo('waste-food')).resolves.toMatchObject({
      kind: 'RULE',
      updatedAt: null,
    })
  })

  it('opens living rules by their lowercase code, case-sensitively like the BE', async () => {
    await login(admin)
    await expect(
      fetchGuideTranslation('waste-food', 'ko'),
    ).resolves.toMatchObject({ code: 'waste-food', title: '음식물 쓰레기' })
    await expect(
      fetchGuideTranslation('WASTE-FOOD', 'ko'),
    ).rejects.toMatchObject({ status: 404, code: 'GUIDE_NOT_FOUND' })
  })
})
