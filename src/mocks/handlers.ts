import { http, HttpResponse } from 'msw'

// Only implemented auth contracts are mocked. Add feature handlers after BE review.
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
  http.get('*/api/members/me', () =>
    HttpResponse.json(
      { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      { status: 401 },
    ),
  ),
  http.get('*/api/auth/email/availability', ({ request }) => {
    const email = (new URL(request.url).searchParams.get('email') ?? '')
      .trim()
      .toLowerCase()
    // Match BE CredentialPolicy: normalize, limit to 255 chars, validate domains.
    const emailPattern =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/
    if (email.length > 255 || !emailPattern.test(email))
      return HttpResponse.json(
        { code: 'EMAIL_FORMAT', message: '이메일 형식이 올바르지 않습니다.' },
        { status: 400 },
      )
    return HttpResponse.json({
      data: { email, available: email !== 'taken@example.com' },
    })
  }),
]
