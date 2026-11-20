import { http, HttpResponse } from 'msw'
import {
  emailPattern,
  firstPasswordError,
} from '@/features/auth/password-rules'
import type { GuideTranslationResponse } from '@/features/admin/api'
import type { MessageResponse } from '@/features/chat/api'
import type { MemberResponse } from '@/shared/api/types'

/**
 * Dev/test-only mock of the BE auth + onboarding contract (docs: Swagger).
 * Never imported by production code. Fixed values for manual testing:
 * - signup verification code: 123456
 * - existing member: taken@example.com / abcd1234 (onboarded)
 * - admin: admin@example.com / admin1234 (onboarded, ADMIN)
 * - checklist text: CL-01 in ko
 * - valid reset link: /password-reset?token=mock-reset-token
 */
export const mockSignupCode = '123456'
export const mockResetToken = 'mock-reset-token'

type MockMember = MemberResponse & { password: string }
interface MockState {
  members: Record<string, MockMember>
  sessionEmail: string | null
  codes: Record<string, { code: string; sentAt: number; attempts: number }>
  verifiedAt: Record<string, number>
  loginFailures: Record<string, { count: number; lockedUntil: number }>
  resetSentAt: Record<string, number>
  nextId: number
  conversations: Record<string, MockConversation>
  nextChatId: number
  guides: Record<string, GuideTranslationResponse>
  reviews: Record<
    string,
    { reviewed: boolean; adminMemo: string | null; reviewedAt: string | null }
  >
}

interface MockConversation {
  conversationId: number
  ownerEmail: string
  language: string
  createdAt: string
  updatedAt: string
  messages: MessageResponse[]
}

const storageKey = 'siot:mock-state'

function seedState(): MockState {
  return {
    members: {
      'taken@example.com': {
        id: 1,
        email: 'taken@example.com',
        password: 'abcd1234',
        role: 'USER',
        language: 'ko',
        userType: 'LIVING',
        entryDate: null,
        purpose: 'WORK',
        residences: [],
        stayExpiry: null,
        emailVerified: true,
        onboarded: true,
      },
      'admin@example.com': {
        id: 2,
        email: 'admin@example.com',
        password: 'admin1234',
        role: 'ADMIN',
        language: 'ko',
        userType: 'LIVING',
        entryDate: null,
        purpose: 'OTHER',
        residences: [],
        stayExpiry: null,
        emailVerified: true,
        onboarded: true,
      },
    },
    sessionEmail: null,
    codes: {},
    verifiedAt: {},
    loginFailures: {},
    resetSentAt: {},
    nextId: 3,
    // Sample answers for the admin review screen (ADM-08).
    conversations: {
      '1': {
        conversationId: 1,
        ownerEmail: 'taken@example.com',
        language: 'ko',
        createdAt: '2026-11-19T02:00:00Z',
        updatedAt: '2026-11-19T02:01:00Z',
        messages: [
          seedMessage(1, 'USER', '자동차세는 언제 내요?', null, null),
          seedMessage(
            2,
            'ASSISTANT',
            '자동차세는 6월과 12월에 내요.',
            'ANSWERED',
            false,
          ),
          seedMessage(3, 'USER', '시흥에서 제일 맛있는 식당은?', null, null),
          seedMessage(
            4,
            'ASSISTANT',
            '자료에서 찾지 못했어요. 추측해서 답하지 않을게요.',
            'NO_EVIDENCE',
            null,
          ),
        ],
      },
    },
    nextChatId: 2,
    guides: {
      'CL-01:ko': {
        code: 'CL-01',
        language: 'ko',
        title: '외국인등록',
        summary: '입국 후 90일 안에 관할 출입국·외국인관서에서 신청',
        content: null,
        badge: '입국 후 90일 이내',
        place: '관할 출입국·외국인관서',
        docs: ['여권', '사진 1장'],
        fee: '30,000원',
        law: '출입국관리법 제31조',
        penalty: '과태료',
        sourceName: '하이코리아',
        noticeChangedAt: null,
        updatedAt: '2026-11-14T00:00:00Z',
      },
    },
    reviews: {},
  }
}

function loadState(): MockState {
  try {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) return JSON.parse(saved) as MockState
  } catch {
    /* Node tests have no sessionStorage. */
  }
  return seedState()
}

let state = loadState()

function persist() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    /* Node tests have no sessionStorage. */
  }
}

/** Tests call this between cases. */
export function resetMockState() {
  state = seedState()
  persist()
}

const error = (
  status: number,
  code: string,
  message: string,
  details?: object,
) =>
  HttpResponse.json({ code, message, ...(details && { details }) }, { status })

const normalize = (email: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

function isEmail(email: string) {
  return email.length <= 255 && emailPattern.test(email)
}

function publicMember(member: MockMember): MemberResponse {
  const copy: Partial<MockMember> = { ...member }
  delete copy.password
  return copy as MemberResponse
}

function currentMember(): MockMember | undefined {
  return state.sessionEmail ? state.members[state.sessionEmail] : undefined
}

const unauthorized = () => error(401, 'UNAUTHORIZED', '로그인이 필요합니다.')

/** BE checks rules in order and reports only the first violation. */
function passwordError(password: unknown, confirm: unknown, email: string) {
  if (typeof password !== 'string' || typeof confirm !== 'string')
    return 'INVALID_INPUT'
  const key = firstPasswordError(password, email)
  if (key === 'validation.passwordRequired') return 'PASSWORD_LENGTH'
  if (key) return key.replace('errors.', '')
  if (!/^[\x21-\x7e]+$/.test(password)) return 'PASSWORD_INVALID_CHARACTER'
  if (password !== confirm) return 'PASSWORD_CONFIRM_MISMATCH'
  return undefined
}

const languages = ['ko', 'en', 'zh', 'vi'] as const
const toLanguage = (value: unknown) =>
  languages.find((language) => language === value) ?? 'ko'

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json()
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export const handlers = [
  http.get(
    '*/api/auth/csrf',
    () =>
      new HttpResponse(null, {
        status: 204,
        headers: {
          'Set-Cookie': 'XSRF-TOKEN=mock-csrf-token; Path=/; SameSite=Lax',
        },
      }),
  ),

  http.get('*/api/members/me', () => {
    const member = currentMember()
    return member
      ? HttpResponse.json({ data: publicMember(member) })
      : unauthorized()
  }),

  http.patch('*/api/members/me', async ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const { language } = await body(request)
    if (language !== null && language !== undefined) {
      if (!languages.some((item) => item === language))
        return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
      member.language = toLanguage(language)
    }
    persist()
    return HttpResponse.json({ data: publicMember(member) })
  }),

  http.put('*/api/members/me/onboarding', async ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const answers = await body(request)
    if (answers.userType !== 'NEW' && answers.userType !== 'LIVING')
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    Object.assign(member, {
      userType: answers.userType,
      entryDate: answers.entryDate ?? null,
      purpose: answers.purpose ?? null,
      residences: Array.isArray(answers.residences) ? answers.residences : [],
      stayExpiry: answers.stayExpiry ?? null,
      onboarded: true,
    })
    persist()
    return HttpResponse.json({ data: publicMember(member) })
  }),

  http.get('*/api/auth/email/availability', ({ request }) => {
    const email = normalize(new URL(request.url).searchParams.get('email'))
    if (!isEmail(email))
      return error(400, 'EMAIL_FORMAT', '이메일 형식이 올바르지 않습니다.')
    return HttpResponse.json({
      data: { email, available: !state.members[email] },
    })
  }),

  http.post('*/api/auth/signup/email-verification', async ({ request }) => {
    const email = normalize((await body(request)).email)
    if (!isEmail(email))
      return error(400, 'EMAIL_FORMAT', '이메일 형식으로 입력해 주세요.')
    if (state.members[email])
      return error(409, 'DUPLICATE_EMAIL', '이미 가입한 이메일입니다.')
    const previous = state.codes[email]
    if (previous && Date.now() - previous.sentAt < 60_000)
      return error(
        429,
        'EMAIL_VERIFICATION_TOO_FREQUENT',
        '인증 코드는 1분에 한 번만 요청할 수 있습니다.',
      )
    state.codes[email] = {
      code: mockSignupCode,
      sentAt: Date.now(),
      attempts: 0,
    }
    persist()
    return HttpResponse.json(
      { data: { email, expiresInSeconds: 600, resendAvailableInSeconds: 60 } },
      { status: 202 },
    )
  }),

  http.post(
    '*/api/auth/signup/email-verification/confirm',
    async ({ request }) => {
      const input = await body(request)
      const email = normalize(input.email)
      const code = typeof input.code === 'string' ? input.code.trim() : ''
      const sent = state.codes[email]
      if (!/^\d{6}$/.test(code))
        return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
      if (!sent || sent.attempts >= 5 || Date.now() - sent.sentAt > 600_000)
        return error(
          400,
          'EMAIL_VERIFICATION_EXPIRED',
          '인증 코드가 만료되었습니다. 코드를 다시 요청해 주세요.',
        )
      if (sent.code !== code) {
        sent.attempts += 1
        persist()
        return error(
          400,
          'EMAIL_VERIFICATION_CODE_INVALID',
          '인증 코드가 맞지 않습니다.',
        )
      }
      delete state.codes[email]
      state.verifiedAt[email] = Date.now()
      persist()
      return new HttpResponse(null, { status: 204 })
    },
  ),

  http.post('*/api/auth/signup', async ({ request }) => {
    const input = await body(request)
    const email = normalize(input.email)
    if (!isEmail(email))
      return error(400, 'EMAIL_FORMAT', '이메일 형식으로 입력해 주세요.')
    if (state.members[email])
      return error(409, 'DUPLICATE_EMAIL', '이미 가입한 이메일입니다.')
    const verifiedAt = state.verifiedAt[email]
    if (!verifiedAt || Date.now() - verifiedAt > 30 * 60_000)
      return error(
        400,
        'EMAIL_NOT_VERIFIED',
        '이메일 인증을 먼저 완료해 주세요.',
      )
    const code = passwordError(input.password, input.passwordConfirm, email)
    if (code) return error(400, code, '비밀번호 규칙을 확인해 주세요.')
    delete state.verifiedAt[email]
    const member: MockMember = {
      id: state.nextId++,
      email,
      password: input.password as string,
      role: 'USER',
      language: toLanguage(input.language),
      userType: null,
      entryDate: null,
      purpose: null,
      residences: [],
      stayExpiry: null,
      emailVerified: true,
      onboarded: false,
    }
    state.members[email] = member
    state.sessionEmail = email
    persist()
    return HttpResponse.json({ data: publicMember(member) }, { status: 201 })
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const input = await body(request)
    const email = normalize(input.email)
    const failures = (state.loginFailures[email] ??= {
      count: 0,
      lockedUntil: 0,
    })
    if (failures.lockedUntil > Date.now())
      return error(
        429,
        'LOGIN_LOCKED',
        '로그인에 5회 연속 실패하여 5분 동안 로그인할 수 없습니다.',
      )
    const member = state.members[email]
    if (!member || member.password !== input.password) {
      failures.count += 1
      if (failures.count >= 5) {
        failures.lockedUntil = Date.now() + 5 * 60_000
        failures.count = 5
      }
      const details = {
        failedAttempts: failures.count,
        maxAttempts: 5,
        remainingAttempts: 5 - failures.count,
      }
      if (failures.count >= 5) failures.count = 0
      persist()
      return error(
        401,
        'LOGIN_FAILED',
        '이메일 또는 비밀번호가 맞지 않습니다.',
        details,
      )
    }
    delete state.loginFailures[email]
    state.sessionEmail = email
    persist()
    return HttpResponse.json({ data: publicMember(member) })
  }),

  http.post('*/api/members/me/withdrawal', async ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const { password } = await body(request)
    if (typeof password !== 'string')
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    // Wrong password is 400, not 401, so it is not mistaken for an expired session.
    if (password !== member.password)
      return error(400, 'PASSWORD_INCORRECT', '비밀번호가 맞지 않습니다.')
    delete state.members[member.email]
    for (const [id, conversation] of Object.entries(state.conversations))
      if (conversation.ownerEmail === member.email)
        delete state.conversations[id]
    state.sessionEmail = null
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/api/auth/logout', () => {
    state.sessionEmail = null
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/api/auth/password-reset', async ({ request }) => {
    const email = normalize((await body(request)).email)
    if (!email)
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    const sentAt = state.resetSentAt[email]
    if (sentAt && Date.now() - sentAt < 60_000)
      return error(
        429,
        'PASSWORD_RESET_TOO_FREQUENT',
        '비밀번호 재설정은 1분에 한 번만 요청할 수 있습니다.',
      )
    state.resetSentAt[email] = Date.now()
    persist()
    // Always 202 without a body, whether or not the email is registered.
    return new HttpResponse(null, { status: 202 })
  }),

  http.get('*/api/auth/password-reset/validation', ({ request }) =>
    new URL(request.url).searchParams.get('token') === mockResetToken
      ? new HttpResponse(null, { status: 204 })
      : error(
          400,
          'PASSWORD_RESET_TOKEN_INVALID',
          '재설정 링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요.',
        ),
  ),

  http.post('*/api/auth/password-reset/confirm', async ({ request }) => {
    const input = await body(request)
    if (input.token !== mockResetToken)
      return error(
        400,
        'PASSWORD_RESET_TOKEN_INVALID',
        '재설정 링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요.',
      )
    const member = state.members['taken@example.com']
    const code = passwordError(
      input.password,
      input.passwordConfirm,
      member.email,
    )
    if (code) return error(400, code, '비밀번호 규칙을 확인해 주세요.')
    member.password = input.password as string
    if (state.sessionEmail === member.email) state.sessionEmail = null
    delete state.loginFailures[member.email]
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  // Chatbot (CB-03·04·08·09·11·16). Canned answers by keyword, not real RAG.
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
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    const mine = Object.values(state.conversations)
      .filter((item) => item.ownerEmail === member.email)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return HttpResponse.json({
      data: {
        content: mine
          .slice(page * size, page * size + size)
          .map(conversationView),
        page,
        size,
        totalElements: mine.length,
        totalPages: Math.ceil(mine.length / size),
        hasNext: (page + 1) * size < mine.length,
      },
    })
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

  // Admin (ADM-01·08, CHK-06). Non-admins get 403 FORBIDDEN like the BE.
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

function page<T>(rows: T[], url: URL) {
  const page = Number(url.searchParams.get('page') ?? 0)
  const size = Number(url.searchParams.get('size') ?? 20)
  return {
    content: rows.slice(page * size, page * size + size),
    page,
    size,
    totalElements: rows.length,
    totalPages: Math.ceil(rows.length / size),
    hasNext: (page + 1) * size < rows.length,
  }
}

function seedMessage(
  messageId: number,
  role: MessageResponse['role'],
  content: string,
  answerStatus: MessageResponse['answerStatus'],
  helpful: boolean | null,
): MessageResponse {
  return {
    messageId,
    role,
    content,
    answerStatus,
    sources: [],
    relatedPages: [],
    emergencyContacts: [],
    referral: null,
    helpful,
    createdAt: `2026-11-19T02:0${messageId}:00Z`,
  }
}

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
    content:
      '입국한 날부터 90일 안에 안산출입국·외국인사무소에서 해요. 하이코리아에서 방문 예약을 먼저 하세요.',
    sources: [
      {
        order: 1,
        documentName: '시흥시 외국인주민 생활안내',
        pageStart: 12,
        pageEnd: 13,
        sourceUrl: null,
        relevanceScore: 0.82,
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

/** Another member's conversation looks exactly like a missing one (404). */
function ownConversation(member: MockMember, id: unknown) {
  const conversation = state.conversations[String(id)]
  return conversation?.ownerEmail === member.email ? conversation : undefined
}

function conversationNotFound() {
  return error(404, 'CHAT_CONVERSATION_NOT_FOUND', '대화를 찾을 수 없습니다.')
}
