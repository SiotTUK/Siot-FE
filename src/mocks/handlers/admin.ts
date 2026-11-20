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
} from '../db'

/** Admin (ADM-01·08, CHK-06). Non-admins get 403 FORBIDDEN like the BE. */
export const adminHandlers = [
  http.get('*/api/admin/members', ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const url = new URL(request.url)
    const email = (url.searchParams.get('email') ?? '').toLowerCase()
    const role = url.searchParams.get('role')
    const rows = Object.values(state.members)
      .filter((member) => !email || member.email.includes(email))
      .filter((member) => !role || member.role === role)
      .sort((a, b) => b.id - a.id)
      .map((member) => ({
        id: member.id,
        email: member.email,
        role: member.role,
        createdAt: '2026-11-20T00:00:00Z',
      }))
    return HttpResponse.json({ data: page(rows, url) })
  }),

  http.put('*/api/admin/members/:id/role', async ({ request, params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const target = Object.values(state.members).find(
      (member) => member.id === Number(params.id),
    )
    if (!target)
      return error(404, 'MEMBER_NOT_FOUND', '회원을 찾을 수 없습니다.')
    const { role } = await body(request)
    if (role !== 'USER' && role !== 'ADMIN')
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    if (target.email === state.sessionEmail && role === 'USER')
      return error(
        400,
        'ADMIN_SELF_DEMOTION',
        '자기 자신의 관리자 권한은 내릴 수 없습니다.',
      )
    target.role = role
    persist()
    return HttpResponse.json({
      data: {
        id: target.id,
        email: target.email,
        role: target.role,
        createdAt: '2026-11-20T00:00:00Z',
      },
    })
  }),

  http.get('*/api/admin/chat/reviews', ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const url = new URL(request.url)
    const type = url.searchParams.get('type') ?? 'ALL'
    const reviewed = url.searchParams.get('reviewed')
    const rows = Object.values(state.conversations)
      .flatMap((conversation) =>
        conversation.messages.map((message, index) => ({
          conversation,
          message,
          question: conversation.messages[index - 1],
        })),
      )
      .filter(
        ({ message }) =>
          message.role === 'ASSISTANT' &&
          (message.helpful === false || message.answerStatus === 'NO_EVIDENCE'),
      )
      .map(({ conversation, message, question }) => {
        const record = state.reviews[message.messageId] ?? {
          reviewed: false,
          adminMemo: null,
          reviewedAt: null,
        }
        return {
          messageId: message.messageId,
          conversationId: conversation.conversationId,
          language: conversation.language,
          reason: message.helpful === false ? 'NEGATIVE' : 'NO_EVIDENCE',
          question: question?.content ?? null,
          answer: message.content,
          answerStatus: message.answerStatus,
          helpful: message.helpful,
          feedbackComment: null,
          sources: message.sources,
          reviewed: record.reviewed,
          adminMemo: record.adminMemo,
          reviewedBy: record.reviewed ? 2 : null,
          reviewedAt: record.reviewedAt,
          createdAt: message.createdAt,
        }
      })
      .filter((row) => type === 'ALL' || row.reason === type)
      .filter((row) => reviewed === null || String(row.reviewed) === reviewed)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json({ data: page(rows, url) })
  }),

  http.patch(
    '*/api/admin/chat/reviews/:messageId',
    async ({ request, params }) => {
      const denied = requireAdmin()
      if (denied) return denied
      const exists = Object.values(state.conversations).some((conversation) =>
        conversation.messages.some(
          (message) => message.messageId === Number(params.messageId),
        ),
      )
      if (!exists)
        return error(
          404,
          'CHAT_REVIEW_NOT_FOUND',
          '검토 대상 답변을 찾을 수 없습니다.',
        )
      const { reviewed, adminMemo } = await body(request)
      if (typeof reviewed !== 'boolean')
        return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
      state.reviews[String(params.messageId)] = {
        reviewed,
        adminMemo:
          typeof adminMemo === 'string' && adminMemo ? adminMemo : null,
        reviewedAt: new Date().toISOString(),
      }
      persist()
      return HttpResponse.json({
        data: { messageId: Number(params.messageId), reviewed },
      })
    },
  ),

  http.get('*/api/admin/guides/:code/translations/:language', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const code = String(params.code)
    if (!/^(CL|LC)-/.test(code))
      return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    const saved = state.guides[`${code}:${String(params.language)}`]
    return saved
      ? HttpResponse.json({ data: saved })
      : error(
          404,
          'GUIDE_TRANSLATION_NOT_FOUND',
          '이 언어의 문구가 아직 없습니다.',
        )
  }),

  http.put(
    '*/api/admin/guides/:code/translations/:language',
    async ({ request, params }) => {
      const denied = requireAdmin()
      if (denied) return denied
      const code = String(params.code)
      if (!/^(CL|LC)-/.test(code))
        return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
      const input = await body(request)
      if (typeof input.title !== 'string' || !input.title.trim())
        return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
      const key = `${code}:${String(params.language)}`
      const now = new Date().toISOString()
      const text = (value: unknown) =>
        typeof value === 'string' && value ? value : null
      state.guides[key] = {
        code,
        language: toLanguage(params.language),
        title: input.title,
        summary: text(input.summary),
        content: text(input.content),
        badge: text(input.badge),
        place: text(input.place),
        docs: Array.isArray(input.docs) ? input.docs.map(String) : [],
        fee: text(input.fee),
        law: text(input.law),
        penalty: text(input.penalty),
        sourceName: text(input.sourceName),
        noticeChangedAt:
          input.noticeChanged === true
            ? now
            : (state.guides[key]?.noticeChangedAt ?? null),
        updatedAt: now,
      }
      persist()
      return HttpResponse.json({ data: state.guides[key] })
    },
  ),
]

function requireAdmin() {
  const member = currentMember()
  if (!member) return unauthorized()
  if (member.role !== 'ADMIN')
    return error(403, 'FORBIDDEN', '접근 권한이 없습니다.')
  return undefined
}
