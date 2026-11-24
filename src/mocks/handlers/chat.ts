import { http, HttpResponse } from 'msw'
import {
  body,
  currentMember,
  error,
  page,
  persist,
  state,
  toLanguage,
  unauthorized,
  type MockConversation,
  type MockMember,
} from '../db'
import type { MessageResponse } from '@/features/chat/api'

/** Chatbot (CB-03·04·08·09·11·16). Canned answers by keyword, not real RAG. */
export const chatHandlers = [
  http.get('*/api/chat/suggestions', ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const language = toLanguage(
      new URL(request.url).searchParams.get('language'),
    )
    return HttpResponse.json({
      data: {
        userType: member.userType,
        language,
        questions: [
          '체류지 변경신고는 어디서 해요?',
          '쓰레기는 어떻게 버려요?',
          '아플 때 병원은?',
        ],
      },
    })
  }),

  http.get('*/api/chat/conversations', ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const mine = Object.values(state.conversations)
      .filter((item) => item.ownerEmail === member.email)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(conversationView)
    return HttpResponse.json({ data: page(mine, new URL(request.url)) })
  }),

  http.post('*/api/chat/conversations', async ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const { language } = await body(request)
    const now = new Date().toISOString()
    const conversation: MockConversation = {
      conversationId: state.nextChatId++,
      ownerEmail: member.email,
      language: language ? toLanguage(language) : member.language,
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    state.conversations[conversation.conversationId] = conversation
    persist()
    return HttpResponse.json(
      { data: conversationView(conversation) },
      { status: 201 },
    )
  }),

  http.get('*/api/chat/conversations/:id/messages', ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const conversation = ownConversation(member, params.id)
    if (!conversation) return conversationNotFound()
    return HttpResponse.json({ data: conversation.messages })
  }),

  http.post(
    '*/api/chat/conversations/:id/messages',
    async ({ request, params }) => {
      const member = currentMember()
      if (!member) return unauthorized()
      const conversation = ownConversation(member, params.id)
      if (!conversation) return conversationNotFound()
      const { content } = await body(request)
      if (
        typeof content !== 'string' ||
        !content.trim() ||
        content.length > 1000
      )
        return error(
          400,
          'CHAT_QUESTION_LENGTH',
          '질문은 1~1000자로 입력해 주세요.',
        )
      // Mask long digit runs such as passport or residence card numbers (CB-05).
      const maskedContent = content.replace(/\d{6,}/g, (digits) =>
        '*'.repeat(digits.length),
      )
      const now = new Date().toISOString()
      const question = message('USER', maskedContent, now)
      const answer = {
        ...message('ASSISTANT', '', now),
        ...cannedAnswer(content),
      }
      conversation.messages.push(question, answer)
      conversation.updatedAt = now
      persist()
      return HttpResponse.json({
        data: { question, answer, masked: maskedContent !== content },
      })
    },
  ),

  http.delete('*/api/chat/conversations/:id', ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const conversation = ownConversation(member, params.id)
    if (!conversation) return conversationNotFound()
    delete state.conversations[conversation.conversationId]
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.put(
    '*/api/chat/conversations/:id/messages/:messageId/feedback',
    async ({ request, params }) => {
      const member = currentMember()
      if (!member) return unauthorized()
      const conversation = ownConversation(member, params.id)
      if (!conversation) return conversationNotFound()
      const target = conversation.messages.find(
        (item) => item.messageId === Number(params.messageId),
      )
      if (!target)
        return error(
          404,
          'CHAT_MESSAGE_NOT_FOUND',
          '메시지를 찾을 수 없습니다.',
        )
      if (target.role !== 'ASSISTANT')
        return error(
          400,
          'CHAT_FEEDBACK_NOT_ALLOWED',
          '챗봇 답변만 평가할 수 있습니다.',
        )
      const { helpful } = await body(request)
      if (typeof helpful !== 'boolean')
        return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
      target.helpful = helpful
      persist()
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // Admin (ADM-01·08, CHK-06). Non-admins get 403 FORBIDDEN like the BE.,
]

function nextMessageId() {
  return (
    Math.max(
      999,
      ...Object.values(state.conversations).flatMap((item) =>
        item.messages.map((entry) => entry.messageId),
      ),
    ) + 1
  )
}

function message(
  role: MessageResponse['role'],
  content: string,
  createdAt: string,
  messageId = nextMessageId(),
): MessageResponse {
  return {
    messageId,
    role,
    content,
    answerStatus: null,
    sources: [],
    relatedPages: [],
    emergencyContacts: [],
    referral: null,
    helpful: null,
    createdAt,
  }
}

function cannedAnswer(question: string): Partial<MessageResponse> {
  const answerId = { messageId: nextMessageId() + 1 }
  if (/불|화재|fire/i.test(question))
    return {
      ...answerId,
      answerStatus: 'ANSWERED',
      content: '지금 바로 119에 전화하고 먼저 대피하세요.',
      emergencyContacts: [
        { number: '119', label: '화재·구급' },
        { number: '112', label: '경찰' },
      ],
    }
  if (/비자|visa/i.test(question))
    return {
      ...answerId,
      answerStatus: 'ANSWERED',
      content: '비자 연장 절차는 체류 자격마다 달라요.',
      referral: {
        notice: '개인 상황에 따라 달라서 판단할 수 없어요.',
        contacts: [
          {
            topic: 'VISA',
            number: '1345',
            label: '외국인종합안내센터 (비자·체류)',
          },
        ],
      },
    }
  if (/맛집|식당|restaurant/i.test(question))
    return {
      ...answerId,
      answerStatus: 'NO_EVIDENCE',
      content:
        '자료에서 찾지 못했어요. 추측해서 답하지 않을게요.\n· ☎1345 (24시간)\n· 외국인주민과 ☎031-310-3009',
    }
  return {
    ...answerId,
    answerStatus: 'ANSWERED',
    // Like the BE: Markdown text, several chunks cited from one document.
    content:
      '**입국한 날부터 90일 안**에 안산출입국·외국인사무소에서 해요.\n\n1. [하이코리아](https://www.hikorea.go.kr)에서 방문 예약을 먼저 하세요.\n2. 여권, 사진 1장, 수수료를 준비하세요.',
    sources: [
      {
        order: 1,
        documentName: '시흥시 외국인주민 생활안내',
        pageStart: 12,
        pageEnd: 13,
        sourceUrl: null,
        relevanceScore: 0.82,
      },
      {
        order: 2,
        documentName: '시흥시 외국인주민 생활안내',
        pageStart: 13,
        pageEnd: null,
        sourceUrl: null,
        relevanceScore: 0.79,
      },
      {
        order: 3,
        documentName: '시흥시 외국인주민 생활안내',
        pageStart: 13,
        pageEnd: null,
        sourceUrl: null,
        relevanceScore: 0.74,
      },
    ],
    relatedPages: [{ type: 'CHECKLIST', code: 'CL-01', title: '외국인등록' }],
  }
}

function conversationView(conversation: MockConversation) {
  return {
    conversationId: conversation.conversationId,
    language: conversation.language,
    title:
      conversation.messages.find((item) => item.role === 'USER')?.content ??
      null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }
}

/** Another member's conversation looks exactly like a missing one (404). */ function ownConversation(
  member: MockMember,
  id: unknown,
) {
  const conversation = state.conversations[String(id)]
  return conversation?.ownerEmail === member.email ? conversation : undefined
}

function conversationNotFound() {
  return error(404, 'CHAT_CONVERSATION_NOT_FOUND', '대화를 찾을 수 없습니다.')
}
