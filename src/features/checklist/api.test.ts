import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { saveOnboarding } from '@/features/onboarding/api'
import { fetchChecklist, updateChecklistItem } from './api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      interceptedFetch(
        typeof input === 'string' ? new URL(input, origin) : input,
        init,
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

const newArrival = {
  userType: 'NEW' as const,
  entryDate: '2026-11-01',
  purpose: 'WORK' as const,
  residences: ['CAR' as const],
  stayExpiry: null,
}

describe('checklist contract', () => {
  it('requires login', async () => {
    await expect(fetchChecklist('ko')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
  })

  it('follows the onboarding answers and server deadlines', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    await saveOnboarding(newArrival)
    const summary = await fetchChecklist('ko')
    const codes = summary.items.map((item) => item.code)
    expect(codes).toEqual(
      expect.arrayContaining(['CL-01', 'CL-04', 'CL-07', 'CL-10', 'CL-20']),
    )
    expect(codes).not.toContain('CL-05')
    expect(summary.items.find((item) => item.code === 'CL-10')).toMatchObject({
      status: 'OVERDUE',
      periodKey: '2026-12',
    })
    expect(summary).toMatchObject({
      totalRequiredCount: 4,
      completedRequiredCount: 0,
    })
  })

  it('marks, unmarks and rejects unknown items', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    await saveOnboarding(newArrival)
    await updateChecklistItem('CL-01', { periodKey: '', status: 'DONE' })
    await updateChecklistItem('CL-10', {
      periodKey: '2026-12',
      status: 'NOT_APPLICABLE',
    })
    let summary = await fetchChecklist('ko')
    // Like the BE, completed items come last.
    expect(summary.items.at(-1)?.code).toBe('CL-01')
    expect(summary).toMatchObject({
      completedRequiredCount: 1,
      progressPercentage: 25,
    })
    expect(summary.items.find((item) => item.code === 'CL-10')?.status).toBe(
      'NOT_APPLICABLE',
    )

    await updateChecklistItem('CL-01', { periodKey: '', status: null })
    summary = await fetchChecklist('ko')
    expect(summary.items.find((item) => item.code === 'CL-01')?.status).toBe(
      'TODO',
    )
    await expect(
      updateChecklistItem('CL-99', { periodKey: '', status: 'DONE' }),
    ).rejects.toMatchObject({ status: 404, code: 'GUIDE_NOT_FOUND' })
  })
})
