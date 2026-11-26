import { http, HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'
import { server } from '@/test/setup'
import {
  eventReportSchema,
  quotedTextMaxLength,
  submitEventReport,
} from './event-report'

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
  expect(
    eventReportSchema.safeParse({
      quotedText: 'a'.repeat(quotedTextMaxLength + 1),
      reason: 'other',
    }).error?.issues[0]?.message,
  ).toBe('events.report.quoteTooLong')
})

it('cuts the title snapshot to the server limit', async () => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal('fetch', (input: string, init: RequestInit) =>
    interceptedFetch(new URL(input, 'http://localhost'), init),
  )
  const bodies: { targetTitleSnapshot: string; reason: string }[] = []
  server.use(
    http.post('*/api/reports', async ({ request }) => {
      bodies.push((await request.json()) as (typeof bodies)[number])
      return HttpResponse.json({ data: { reportId: 1 } }, { status: 201 })
    }),
  )
  await submitEventReport(
    {
      eventId: 4,
      targetTitleSnapshot: '가'.repeat(300),
      quotedText: 'Starts at 5 p.m.',
      language: 'ko',
      reason: 'translation',
    },
    () => true,
  )
  expect(bodies[0]?.targetTitleSnapshot).toHaveLength(255)
  expect(bodies[0]?.reason).toBe('TRANSLATION')
})

it('posts the event, displayed title and language with the API reason code and leaves ordinary failures for the caller to retry', async () => {
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
  expect(bodies).toEqual([{ ...input, reason: 'CONTENT' }])
  await expect(submitEventReport(input, () => true)).resolves.toEqual({
    reportId: 1,
  })
  expect(bodies).toHaveLength(2)
})
