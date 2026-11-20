import { http, HttpResponse } from 'msw'
import {
  body,
  currentMember,
  error,
  languages,
  persist,
  publicMember,
  state,
  toLanguage,
  unauthorized,
} from '../db'

/** Me, language, onboarding answers, withdrawal. */
export const memberHandlers = [
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
]
