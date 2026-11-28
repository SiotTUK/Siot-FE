import { http, HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'
import {
  fetchAdminReports,
  reportTargetPath,
} from '@/features/admin/report-api'
import { login } from '@/features/auth/api'
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

// Contract tests against the MSW mock (not the real BE).
it('is accepted by the mock for checklist and life change task codes, rejected for an unknown one', async () => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=mock-token' })
  vi.stubGlobal('fetch', (input: string, init: RequestInit) =>
    interceptedFetch(new URL(input, 'http://localhost'), init),
  )
  await login({ email: 'taken@example.com', password: 'abcd1234' })
  const report = {
    targetTitleSnapshot: '외국인등록',
    quotedText: '여권만 있으면 돼요',
    language: 'en' as const,
    reason: 'translation' as const,
  }

  for (const guideCode of ['CL-01', 'LC-01-1'])
    await expect(
      submitChecklistReport({ ...report, guideCode }, () => true),
    ).resolves.toMatchObject({ reportId: expect.any(Number) })
  await expect(
    submitChecklistReport({ ...report, guideCode: 'CL-99' }, () => true),
  ).rejects.toMatchObject({ status: 404, code: 'GUIDE_NOT_FOUND' })

  // Admins see the item kind and open it in the guide editor.
  await login({ email: 'admin@example.com', password: 'admin1234' })
  const { content } = await fetchAdminReports('', 0)
  const [task, checklist] = content
  expect(checklist).toMatchObject({
    targetType: 'RULE',
    targetKind: 'CHECKLIST',
    targetCode: 'CL-01',
    targetTitleSnapshot: '외국인등록',
  })
  expect(task).toMatchObject({ targetKind: 'LIFE_CHANGE_TASK' })
  expect(reportTargetPath(checklist)).toBe('/admin/guides?code=CL-01')
  expect(reportTargetPath(task)).toBe('/admin/guides?code=LC-01-1')
})
