import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { server } from '@/test/setup'
import { ruleReportSchema, submitRuleReport } from './rule-report'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
const current = () => true

beforeEach(() => {
  const intercepted = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      intercepted(
        typeof input === 'string' ? new URL(input, origin) : input,
        init,
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('rule report (정보 오류 신고)', () => {
  it('sends the rule slug as guideCode with the API reason code', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    let sent: Record<string, unknown> | undefined
    server.use(
      http.post(`${origin}/api/reports`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { data: { reportId: 7, status: 'RECEIVED' } },
          { status: 201 },
        )
      }),
    )
    await expect(
      submitRuleReport(
        {
          quotedText: '1661-2642',
          reason: 'content',
          guideCode: 'order-noise',
          language: 'vi',
        },
        current,
      ),
    ).resolves.toEqual({ reportId: 7, status: 'RECEIVED' })
    expect(sent).toMatchObject({
      guideCode: 'order-noise',
      reason: 'CONTENT',
      quotedText: '1661-2642',
      language: 'vi',
    })
    expect(sent).not.toHaveProperty('eventId')
    // No title: the BE stores the Korean title for admins.
    expect(sent).not.toHaveProperty('targetTitleSnapshot')
  })

  it('is accepted by the mock for a known rule and rejected for an unknown one', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const report = {
      quotedText: '문구',
      reason: 'other' as const,
      language: 'ko' as const,
    }
    await expect(
      submitRuleReport({ ...report, guideCode: 'waste-food' }, current),
    ).resolves.toMatchObject({ reportId: 1 })
    await expect(
      submitRuleReport({ ...report, guideCode: 'no-such-rule' }, current),
    ).rejects.toMatchObject({ status: 404, code: 'GUIDE_NOT_FOUND' })
  })

  it('shows GUIDE_NOT_FOUND in every language (a rule removed on the BE)', async () => {
    const { default: i18n } = await import('@/shared/i18n')
    for (const language of ['ko', 'en', 'zh', 'vi'])
      expect(
        i18n.getResource(language, 'translation', 'errors.GUIDE_NOT_FOUND'),
        language,
      ).toEqual(expect.any(String))
  })

  it('requires the quoted text and a reason', () => {
    const result = ruleReportSchema.safeParse({ quotedText: '  ', reason: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'rules.report.quoteRequired',
      'rules.report.reasonRequired',
    ])
  })
})
