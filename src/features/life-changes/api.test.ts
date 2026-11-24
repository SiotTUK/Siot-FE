import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, logout } from '@/features/auth/api'
import { fetchChecklist, updateChecklistItem } from '@/features/checklist/api'
import { apiRequest } from '@/shared/api/client'
import { server } from '@/test/setup'
import { deleteLifeChange, fetchLifeChanges, saveLifeChange } from './api'
import { koreaToday, relatedLifeChangeTasks } from './life-changes'

const origin = 'http://localhost'
const path = '/api/members/me/life-changes'
const move = `${path}/LC-01` as const
const initialDate = '2026-11-01'
const newDate = '2026-11-02'
const current = () => true
const member = () => login({ email: 'taken@example.com', password: 'abcd1234' })

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

describe('life change API contract (MSW)', () => {
  it('saves by code and date, lists one record and refreshes the checklist by period', async () => {
    await member()
    expect(await fetchLifeChanges()).toEqual([])

    const saved = await saveLifeChange('LC-01', initialDate, current)
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      move,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ baseDate: initialDate }),
        credentials: 'include',
      }),
    )
    expect(saved).toMatchObject({
      lifeChangeCode: 'LC-01',
      baseDate: initialDate,
    })
    expect(await fetchLifeChanges()).toEqual([saved])
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      path,
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    )
    const first = await fetchChecklist('ko')
    expect(
      relatedLifeChangeTasks(first.items, 'LC-01', initialDate).map(
        (item) => item.code,
      ),
    ).toContain('LC-01-1')
    await updateChecklistItem('LC-01-1', {
      periodKey: initialDate,
      status: 'DONE',
    })
    expect(
      (await fetchChecklist('ko')).items.find((item) => item.code === 'LC-01-1')
        ?.status,
    ).toBe('DONE')

    const updated = await saveLifeChange('LC-01', newDate, current)
    expect(await fetchLifeChanges()).toEqual([updated])
    expect(updated).toMatchObject({
      baseDate: newDate,
      createdAt: saved.createdAt,
    })
    const edited = await fetchChecklist('ko')
    expect(relatedLifeChangeTasks(edited.items, 'LC-01', initialDate)).toEqual(
      [],
    )
    expect(
      relatedLifeChangeTasks(edited.items, 'LC-01', newDate).find(
        (item) => item.code === 'LC-01-1',
      ),
    ).toMatchObject({
      periodKey: newDate,
      deadline: '2026-11-17',
      completed: false,
    })

    await expect(deleteLifeChange('LC-01', current)).resolves.toBeUndefined()
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      move,
      expect.objectContaining({ method: 'DELETE', body: undefined }),
    )
    expect(await fetchLifeChanges()).toEqual([])
    expect(
      relatedLifeChangeTasks(
        (await fetchChecklist('ko')).items,
        'LC-01',
        newDate,
      ),
    ).toEqual([])
    await expect(apiRequest(move, { method: 'DELETE' })).rejects.toMatchObject({
      status: 404,
      code: 'LIFE_CHANGE_NOT_FOUND',
    })
    await expect(deleteLifeChange('LC-01', current)).resolves.toBeUndefined()
  })

  it('rejects dates and codes outside the contract', async () => {
    await member()
    await expect(
      apiRequest(`${path}/LC-09`, {
        method: 'PUT',
        body: { baseDate: initialDate },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_LIFE_CHANGE_CODE' })
    for (const body of [{}, { baseDate: '2026-02-30' }]) {
      await expect(
        apiRequest(move, { method: 'PUT', body }),
      ).rejects.toMatchObject({
        status: 400,
        code: 'INVALID_INPUT',
      })
    }
    expect(await fetchLifeChanges()).toEqual([])
  })

  it('requires a session and isolates records between accounts', async () => {
    await expect(fetchLifeChanges()).rejects.toMatchObject({ status: 401 })
    await member()
    await saveLifeChange('LC-01', initialDate, current)
    await logout()
    await login({ email: 'admin@example.com', password: 'admin1234' })
    expect(await fetchLifeChanges()).toEqual([])
    await expect(apiRequest(move, { method: 'DELETE' })).rejects.toMatchObject({
      status: 404,
    })
    await logout()
    await member()
    expect(await fetchLifeChanges()).toMatchObject([{ baseDate: initialDate }])
  })

  it('prevents save and delete from being retried after CSRF refresh changes the session', async () => {
    await member()
    for (const method of ['PUT', 'DELETE'] as const) {
      let active = true
      const reject = vi.fn(() =>
        HttpResponse.json(
          { code: 'CSRF_TOKEN_INVALID', message: 'CSRF' },
          { status: 403 },
        ),
      )
      server.use(
        http[method === 'PUT' ? 'put' : 'delete'](`${origin}${move}`, reject),
        http.get(`${origin}/api/auth/csrf`, () => {
          active = false
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const request =
        method === 'PUT'
          ? saveLifeChange('LC-01', initialDate, () => active)
          : deleteLifeChange('LC-01', () => active)
      await expect(request).rejects.toMatchObject({ name: 'AbortError' })
      expect(reject).toHaveBeenCalledTimes(1)
    }
  })
})

it('uses the Korean calendar day at the UTC boundary', () => {
  expect(koreaToday(new Date('2026-11-24T14:59:59Z'))).toBe('2026-11-24')
  expect(koreaToday(new Date('2026-11-24T15:00:00Z'))).toBe('2026-11-25')
})
