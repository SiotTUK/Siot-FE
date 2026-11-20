import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, logout } from '@/features/auth/api'
import {
  askQuestion,
  createConversation,
  deleteConversation,
  fetchConversations,
  fetchMessages,
  fetchSuggestions,
  sendFeedback,
} from './api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'

beforeEach(async () => {
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
  await login({ email: 'taken@example.com', password: 'abcd1234' })
})
afterEach(() => vi.unstubAllGlobals())

describe('chat contract', () => {
  it('asks, lists, rates and deletes a conversation', async () => {
    const suggestions = await fetchSuggestions('ko')
    expect(suggestions.questions).toHaveLength(3)

    const { conversationId } = await createConversation('ko')
    const asked = await askQuestion(conversationId, '외국인등록은 어디서 해요?')
    expect(asked.masked).toBe(false)
    expect(asked.question.role).toBe('USER')
    expect(asked.answer).toMatchObject({
      role: 'ASSISTANT',
      answerStatus: 'ANSWERED',
      helpful: null,
    })
    expect(asked.answer.sources[0]?.documentName).toBeTruthy()

    await expect(fetchMessages(conversationId)).resolves.toHaveLength(2)
    const list = await fetchConversations(0)
    expect(list.content[0]).toMatchObject({
      conversationId,
      title: '외국인등록은 어디서 해요?',
    })

    await sendFeedback(conversationId, asked.answer.messageId, false)
    await expect(
      sendFeedback(conversationId, asked.question.messageId, true),
    ).rejects.toMatchObject({ code: 'CHAT_FEEDBACK_NOT_ALLOWED' })
    const [, answer] = await fetchMessages(conversationId)
    expect(answer?.helpful).toBe(false)

    await deleteConversation(conversationId)
    await expect(fetchMessages(conversationId)).rejects.toMatchObject({
      status: 404,
      code: 'CHAT_CONVERSATION_NOT_FOUND',
    })
  })

  it('masks personal numbers and returns emergency and referral info', async () => {
    const { conversationId } = await createConversation('ko')
    const masked = await askQuestion(conversationId, '여권번호 M12345678 비자')
    expect(masked.masked).toBe(true)
    expect(masked.question.content).not.toContain('12345678')
    expect(masked.answer.referral?.contacts[0]?.number).toBe('1345')

    const fire = await askQuestion(conversationId, '집에 불이 났어요!')
    expect(fire.answer.emergencyContacts.map((c) => c.number)).toEqual([
      '119',
      '112',
    ])

    const none = await askQuestion(conversationId, '제일 맛있는 식당은?')
    expect(none.answer).toMatchObject({
      answerStatus: 'NO_EVIDENCE',
      sources: [],
    })
  })

  it('rejects empty or too long questions', async () => {
    const { conversationId } = await createConversation('ko')
    await expect(askQuestion(conversationId, '   ')).rejects.toMatchObject({
      code: 'CHAT_QUESTION_LENGTH',
    })
    await expect(
      askQuestion(conversationId, 'a'.repeat(1001)),
    ).rejects.toMatchObject({ code: 'CHAT_QUESTION_LENGTH' })
  })

  it('requires login', async () => {
    await logout()
    await expect(fetchConversations(0)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
  })
})
