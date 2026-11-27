import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { server } from '@/test/setup'
import {
  changeBillReminder,
  deleteBillTranslation,
  getBillTranslation,
  listBillTranslations,
  translateBill,
} from './api'
import {
  billDaysLeft,
  maxBillBytes,
  photoTypes,
  validateBillFile,
} from './bill-translation'

const origin = 'http://localhost'
const url = `${origin}/api/translations/bills`
const jpg = (name = 'bill.jpg') =>
  new File(['sample'], name, { type: 'image/jpeg' })
const translate = (file = jpg(), remind?: boolean) =>
  translateBill({ file, language: 'en', consent: true, remind })
const signIn = () => login({ email: 'taken@example.com', password: 'abcd1234' })

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=initial' })
  vi.stubGlobal('fetch', (input: string | URL | Request, init?: RequestInit) =>
    interceptedFetch(
      typeof input === 'string' ? new URL(input, origin) : input,
      init,
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('bill translation contract', () => {
  it('uploads a PDF, stores the result, changes its reminder and deletes it', async () => {
    await signIn()
    expect(await listBillTranslations()).toEqual([])
    const result = await translate(
      new File(['sample'], 'multi.pdf', { type: 'application/pdf' }),
      true,
    )
    expect(result).toMatchObject({
      language: 'en',
      readable: true,
      firstPageOnly: true,
      pageCount: 2,
      reminder: true,
      originalLines: expect.any(Array),
      summary: {
        what: expect.any(String),
        due: expect.any(String),
        amount: expect.any(String),
        howToPay: expect.any(String),
      },
      relatedGuides: [
        { code: 'CL-10', kind: 'CHECKLIST', title: expect.any(String) },
      ],
      id: expect.any(Number),
      savedAt: expect.any(String),
    })
    const id = result.id!
    expect(await getBillTranslation(id)).toEqual(result)
    expect(await listBillTranslations()).toEqual([
      {
        id,
        language: 'en',
        documentType: 'TAX_NOTICE',
        issuer: '시흥시',
        taxType: '자동차세',
        what: result.summary?.what,
        amount: 123450,
        dueDate: result.dueDate,
        reminder: true,
        reminderAvailable: true,
        savedAt: result.savedAt,
      },
    ])
    expect(await changeBillReminder(id, false)).toEqual({
      ...result,
      reminder: false,
    })
    expect(await changeBillReminder(id, true)).toEqual(result)
    expect(await deleteBillTranslation(id)).toBeUndefined()
    expect(await listBillTranslations()).toEqual([])
    await expect(getBillTranslation(id)).rejects.toMatchObject({
      status: 404,
      code: 'BILL_TRANSLATION_NOT_FOUND',
    })
  })

  it('keeps recent translations newest first and lists at most ten', async () => {
    await signIn()
    const ids = []
    for (let index = 0; index < 11; index++) ids.push((await translate()).id)
    expect((await listBillTranslations()).map((item) => item.id)).toEqual(
      ids.slice(1).reverse(),
    )
  })

  it('requires authentication and isolates saved bills by account', async () => {
    await expect(listBillTranslations()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    await expect(translate()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    await signIn()
    const { id } = await translate()
    await login({ email: 'admin@example.com', password: 'admin1234' })
    expect(await listBillTranslations()).toEqual([])
    await expect(getBillTranslation(id!)).rejects.toMatchObject({ status: 404 })
    await expect(changeBillReminder(id!, true)).rejects.toMatchObject({
      status: 404,
    })
    await expect(deleteBillTranslation(id!)).rejects.toMatchObject({
      status: 404,
    })
  })

  it.each(['BLURRY', 'CROPPED', 'NOT_A_BILL'])(
    'returns %s without saving the result',
    async (reason) => {
      await signIn()
      expect(await translate(jpg(`${reason}.jpg`))).toMatchObject({
        readable: false,
        retake: { reason },
        id: null,
        reminder: false,
        savedAt: null,
      })
      expect(await listBillTranslations()).toEqual([])
    },
  )

  it('leaves the reminder off if the deadline is unknown', async () => {
    await signIn()
    const result = await translate(jpg('no-deadline.jpg'), true)
    expect(result).toMatchObject({ reminder: false, dueDate: null })
    expect(await listBillTranslations()).toMatchObject([
      { reminderAvailable: false },
    ])
    await expect(changeBillReminder(result.id!, true)).rejects.toMatchObject({
      status: 400,
      code: 'BILL_REMINDER_UNAVAILABLE',
    })
    expect(await changeBillReminder(result.id!, false)).toMatchObject({
      reminder: false,
    })
  })

  it('preserves consent, file, rate and service errors', async () => {
    await signIn()
    await expect(
      translateBill({ file: jpg(), language: 'ko', consent: false }),
    ).rejects.toMatchObject({ status: 400, code: 'BILL_CONSENT_REQUIRED' })
    await expect(
      translate(new File(['sample'], 'bill.gif', { type: 'image/gif' })),
    ).rejects.toMatchObject({ status: 400, code: 'BILL_FILE_INVALID' })
    const large = new File([new Uint8Array(maxBillBytes + 1)], 'large.jpg', {
      type: 'image/jpeg',
    })
    await expect(translate(large)).rejects.toMatchObject({
      status: 413,
      code: 'BILL_FILE_TOO_LARGE',
    })
    for (const [name, status, code] of [
      ['too-frequent.jpg', 429, 'BILL_TRANSLATION_TOO_FREQUENT'],
      ['rate-limit.jpg', 429, 'BILL_TRANSLATION_LIMIT'],
      ['ai-unavailable.jpg', 503, 'AI_UNAVAILABLE'],
    ] as const) {
      await expect(translate(jpg(name))).rejects.toMatchObject({ status, code })
    }
  })

  it('resends multipart fields and the file after one CSRF refresh', async () => {
    const requests: Array<{ token: string | null; values: unknown[] }> = []
    server.use(
      http.post(url, async ({ request }) => {
        expect(request.headers.get('content-type')).toMatch(
          /^multipart\/form-data; boundary=/,
        )
        const form = await request.formData()
        const file = form.get('file') as File
        requests.push({
          token: request.headers.get('x-xsrf-token'),
          values: [
            form.get('language'),
            form.get('consent'),
            form.get('remind'),
            file.name,
            file.type,
            await file.text(),
          ],
        })
        if (requests.length === 1) {
          return HttpResponse.json(
            { code: 'CSRF_TOKEN_INVALID', message: 'CSRF' },
            { status: 403 },
          )
        }
        return HttpResponse.json({ data: { id: 1 } })
      }),
      http.get(`${origin}/api/auth/csrf`, () => {
        document.cookie = 'XSRF-TOKEN=refreshed'
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(translate(jpg(), true)).resolves.toMatchObject({ id: 1 })
    const fields = ['en', 'true', 'true', 'bill.jpg', 'image/jpeg', 'sample']
    expect(requests).toEqual([
      { token: 'initial', values: fields },
      { token: 'refreshed', values: fields },
    ])
  })

  it('aborts an active multipart request', async () => {
    const controller = new AbortController()
    server.use(
      http.post(url, async ({ request }) => {
        await request.formData()
        controller.abort()
        return HttpResponse.json({ data: { id: 1 } })
      }),
    )
    await expect(
      translateBill(
        { file: jpg(), language: 'en', consent: true },
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('bill display and file limits', () => {
  it('sets 10 MiB as the inclusive size limit and rejects empty or unsupported files', () => {
    const file = (size: number, type = 'image/jpeg') =>
      new File([new Uint8Array(size)], 'bill', { type })
    expect(validateBillFile(file(maxBillBytes), photoTypes)).toBeUndefined()
    expect(validateBillFile(file(maxBillBytes + 1), photoTypes)).toBe(
      'BILL_FILE_TOO_LARGE',
    )
    expect(validateBillFile(file(0), photoTypes)).toBe('BILL_FILE_INVALID')
    expect(validateBillFile(file(1, 'application/pdf'), photoTypes)).toBe(
      'BILL_FILE_INVALID',
    )
  })

  it('calculates days relative to the Korea calendar and the printed due date', () => {
    const beforeMidnight = new Date('2026-11-27T14:59:59Z')
    const afterMidnight = new Date('2026-11-27T15:00:00Z')
    expect(billDaysLeft('2026-11-28', beforeMidnight)).toBe(1)
    expect(billDaysLeft('2026-11-28', afterMidnight)).toBe(0)
    expect(billDaysLeft('2026-11-27', afterMidnight)).toBe(-1)
  })
})
