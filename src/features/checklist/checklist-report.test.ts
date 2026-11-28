import { http, HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'
import { server } from '@/test/setup'
import {
  checklistReportSchema,
  submitChecklistReport,
} from './checklist-report'

afterEach(() => vi.unstubAllGlobals())

it('validates report schema with quote and valid reason', () => {
  const result = checklistReportSchema.safeParse({
    quotedText: '   ',
    reason: '',
  })
  expect(
    result.error?.issues.map(({ path, message }) => [path[0], message]),
  ).toEqual([
    ['quotedText', 'checklist.report.quoteRequired'],
    ['reason', 'checklist.report.reasonRequired'],
  ])

  expect(
    checklistReportSchema.parse({
      quotedText: '  외국인등록 수수료 3만원  ',
      reason: 'content',
    }),
  ).toEqual({
    quotedText: '외국인등록 수수료 3만원',
    reason: 'content',
  })
})

it('submits checklist report with guideId or guideCode', async () => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=mock-token' })
  vi.stubGlobal('fetch', (input: string, init: RequestInit) =>
    interceptedFetch(new URL(input, 'http://localhost'), init),
  )

  const bodies: unknown[] = []
  server.use(
    http.post('*/api/reports', async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ data: { reportId: 42 } }, { status: 201 })
    }),
  )

  const input = {
    guideId: 1,
    guideCode: 'CL-01',
    targetTitleSnapshot: '외국인등록',
    quotedText: '여권만 있으면 돼요',
    language: 'ko' as const,
    reason: 'content' as const,
  }

  await expect(submitChecklistReport(input, () => true)).resolves.toEqual({
    reportId: 42,
  })

  expect(bodies).toEqual([
    {
      guideId: 1,
      guideCode: 'CL-01',
      targetTitleSnapshot: '외국인등록',
      quotedText: '여권만 있으면 돼요',
      language: 'ko',
      reason: 'CONTENT',
    },
  ])
})
