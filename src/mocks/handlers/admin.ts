import { http, HttpResponse } from 'msw'
import type { GuideTranslationResponse } from '@/features/admin/api'
import { ruleEntries } from '../data/rule-content'
import { isLanguage } from '@/shared/i18n'
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

  http.patch('*/api/admin/guides/:code', async ({ request, params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const code = String(params.code)
    if (!isGuideCode(code))
      return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    const input = await body(request)
    const { sourceUrl, contact } = input
    const invalid = (value: unknown, max: number) =>
      value != null && (typeof value !== 'string' || value.length > max)
    if (
      invalid(sourceUrl, 2000) ||
      invalid(contact, 255) ||
      (typeof sourceUrl === 'string' &&
        sourceUrl !== '' &&
        !/^\s*https?:\/\/\S+\s*$/.test(sourceUrl))
    )
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    // Like Guide.updateSourceAndContact: omitted stays, blank clears.
    const value = (text: string) => text.trim() || null
    const now = new Date().toISOString()
    const info = { ...state.guideInfo?.[code], updatedAt: now }
    if (typeof sourceUrl === 'string') info.sourceUrl = value(sourceUrl)
    if (typeof contact === 'string') info.contact = value(contact)
    state.guideInfo = { ...state.guideInfo, [code]: info }
    persist()
    return HttpResponse.json({ data: guideInfoView(code) })
  }),

  http.get('*/api/admin/guides/:code', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const code = String(params.code)
    if (!isGuideCode(code))
      return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    return HttpResponse.json({ data: guideInfoView(code) })
  }),

  http.get('*/api/admin/guides/:code/translations/:language', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const code = String(params.code)
    if (!isGuideCode(code))
      return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    const language = String(params.language)
    const saved =
      state.guides[`${code}:${language}`] ?? ruleTranslation(code, language)
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
      if (!isGuideCode(code))
        return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
      const input = await body(request)
      if (typeof input.title !== 'string' || !input.title.trim())
        return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
      const key = `${code}:${String(params.language)}`
      const now = new Date().toISOString()
      const text = (value: unknown) =>
        typeof value === 'string' && value ? value : null
      const language = toLanguage(params.language)
      const saved = state.guides[key] ?? ruleTranslation(code, language)
      state.guides[key] = {
        code,
        language,
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
        // Page numbers come from document loading, not this form.
        pageStart: saved?.pageStart ?? null,
        pageEnd: saved?.pageEnd ?? null,
        sourcePages: saved?.sourcePages ?? null,
        points: Array.isArray(input.points)
          ? input.points.map(String)
          : (saved?.points ?? []),
        when: 'when' in input ? text(input.when) : (saved?.when ?? null),
        contact:
          'contact' in input ? text(input.contact) : (saved?.contact ?? null),
        // BE #23: an admin save of a non-Korean language marks it reviewed.
        reviewed: language !== 'ko',
      }
      persist()
      return HttpResponse.json({ data: state.guides[key] })
    },
  ),
]

/** Seeded source link and contact (same as the checklist mock's CL-01). */
const seededGuideInfo: Record<
  string,
  { sourceUrl: string | null; contact: string | null }
> = { 'CL-01': { sourceUrl: 'https://www.hikorea.go.kr', contact: '1345' } }

/** GuideInfoResponse: admin changes over the seeded values. */
function guideInfoView(code: string) {
  const seeded = seededGuideInfo[code]
  const changed = state.guideInfo?.[code]
  const pick = (field: 'sourceUrl' | 'contact') =>
    changed && field in changed
      ? (changed[field] ?? null)
      : (seeded?.[field] ?? null)
  return {
    code,
    kind: code.startsWith('CL-')
      ? 'CHECKLIST'
      : code.startsWith('LC-')
        ? 'LIFE_CHANGE_TASK'
        : 'RULE',
    sourceUrl: pick('sourceUrl'),
    contact: pick('contact'),
    updatedAt: changed?.updatedAt ?? null,
  }
}

/**
 * Checklist (CL-01), life change task (LC-01-1) and living rule (waste-food)
 * codes. Matched exactly, because the BE looks codes up case-sensitively.
 */
function isGuideCode(code: string) {
  return (
    /^(CL|LC)-/.test(code) || ruleEntries.some((rule) => rule.code === code)
  )
}

/** The BE seeds every rule in all four languages; build it from FE content. */
function ruleTranslation(
  code: string,
  language: string,
): GuideTranslationResponse | undefined {
  const rule = ruleEntries.find((entry) => entry.code === code)
  if (!rule || !isLanguage(language)) return undefined
  return {
    code,
    language,
    title: rule.title[language],
    summary: rule.summary[language],
    content: null,
    badge: null,
    place: null,
    docs: [],
    fee: null,
    law: null,
    penalty: null,
    sourceName: null,
    noticeChangedAt: null,
    updatedAt: '2026-11-26T00:00:00Z',
    pageStart: null,
    pageEnd: null,
    sourcePages: null,
    points: rule.points.map((point) => point[language]),
    when: rule.facts?.when?.[language] ?? null,
    contact: rule.facts?.contact?.[language] ?? null,
    reviewed: false,
  }
}

export function requireAdmin() {
  const member = currentMember()
  if (!member) return unauthorized()
  if (member.role !== 'ADMIN')
    return error(403, 'FORBIDDEN', '접근 권한이 없습니다.')
  return undefined
}
