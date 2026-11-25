import { http, HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'
import { server } from '@/test/setup'
import { eventReportSchema, submitEventReport } from './event-report'

afterEach(() => vi.unstubAllGlobals())

it('requires an actual quote and one of the displayed reasons', () => {
  const result = eventReportSchema.safeParse({ quotedText: '  \n', reason: '' })
  expect(
    result.error?.issues.map(({ path, message }) => [path[0], message]),
  ).toEqual([
    ['quotedText', 'events.report.quoteRequired'],
    ['reason', 'events.report.reasonRequired'],
  ])
  expect(
    eventReportSchema.parse({
      quotedText: '  문구\n둘째 줄  ',
      reason: 'translation',
    }),
  ).toEqual({
    quotedText: '문구\n둘째 줄',
    reason: 'translation',
  })
})

it('posts the event, displayed title and language with a stable reason and leaves ordinary failures for the caller to retry', async () => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal('fetch', (input: string, init: RequestInit) =>
    interceptedFetch(new URL(input, 'http://localhost'), init),
  )
  const bodies: unknown[] = []
  server.use(
    http.post('*/api/reports', async ({ request }) => {
      bodies.push(await request.json())
      return bodies.length === 1
        ? HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'temporary' },
            { status: 503 },
          )
        : HttpResponse.json({ data: { reportId: 1 } }, { status: 201 })
    }),
  )

  const input = {
    eventId: 4,
    targetTitleSnapshot: 'Concert',
    quotedText: 'Starts at 5 p.m.',
    language: 'en',
    reason: 'content',
  } as const
  await expect(submitEventReport(input, () => true)).rejects.toMatchObject({
    status: 503,
  })
  expect(bodies).toEqual([{ ...input, reason: '내용 오류' }])
  await expect(submitEventReport(input, () => true)).resolves.toEqual({
    reportId: 1,
  })
  expect(bodies).toHaveLength(2)
})
