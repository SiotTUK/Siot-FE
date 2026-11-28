import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, logout } from '@/features/auth/api'
import { submitEventReport } from '@/features/events/event-report'
import { mockEvents } from '@/mocks/handlers/events'
import {
  fetchAdminReport,
  fetchAdminReports,
  reportTargetPath,
  updateAdminReport,
  type AdminReport,
} from './report-api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
const admin = { email: 'admin@example.com', password: 'admin1234' }
const member = { email: 'taken@example.com', password: 'abcd1234' }

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

describe('ADM-07 admin reports', () => {
  it('is for admins only', async () => {
    await login(member)
    await expect(fetchAdminReports('', 0)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
    await expect(fetchAdminReport(1)).rejects.toMatchObject({ status: 403 })
    await expect(
      updateAdminReport(1, { status: 'RESOLVED', adminMemo: null }),
    ).rejects.toMatchObject({ status: 403 })
    await logout()
  })

  it('lists newest first and filters by status', async () => {
    await login(admin)
    const all = await fetchAdminReports('', 0)
    const times = all.content.map((report) => report.createdAt)
    expect(times).toEqual([...times].sort().reverse())
    const received = await fetchAdminReports('RECEIVED', 0)
    expect(received.content.length).toBeGreaterThan(0)
    expect(
      received.content.every((report) => report.status === 'RECEIVED'),
    ).toBe(true)
    // Only what the BE sends about the reporter: a member id.
    expect(Object.keys(all.content[0])).not.toContain('reporterEmail')
  })

  it('shows a member report to the admin, then records the status and memo', async () => {
    await login(member)
    const event = mockEvents('ko')[0]
    await submitEventReport(
      {
        eventId: event.eventId,
        targetTitleSnapshot: '',
        quotedText: '무료',
        language: 'en',
        reason: 'translation',
      } as Parameters<typeof submitEventReport>[0],
      () => true,
    )
    await logout()

    await login(admin)
    const [latest] = (await fetchAdminReports('RECEIVED', 0)).content
    expect(latest).toMatchObject({
      eventId: event.eventId,
      targetKind: 'EVENT',
      // The BE keeps the Korean title when the snapshot is blank.
      targetTitleSnapshot: event.title,
      quotedText: '무료',
      language: 'en',
      status: 'RECEIVED',
    })

    const updated = await updateAdminReport(latest.reportId, {
      status: 'resolved' as never,
      adminMemo: '  번역 수정함 ',
    })
    expect(updated).toMatchObject({
      status: 'RESOLVED',
      adminMemo: '번역 수정함',
      processedBy: 2,
    })
    expect(updated.processedAt).not.toBeNull()

    const cleared = await updateAdminReport(latest.reportId, {
      status: 'IN_REVIEW',
      adminMemo: '   ',
    })
    expect(cleared).toMatchObject({ status: 'IN_REVIEW', adminMemo: null })
    await expect(fetchAdminReport(latest.reportId)).resolves.toMatchObject({
      status: 'IN_REVIEW',
    })
  })

  it('rejects an unknown status and a missing report', async () => {
    await login(admin)
    await expect(
      updateAdminReport(1, { status: 'DONE' as never, adminMemo: null }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_INPUT' })
    await expect(
      updateAdminReport(1, { status: 'RESOLVED', adminMemo: 'a'.repeat(2001) }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(fetchAdminReport(99999)).rejects.toMatchObject({
      status: 404,
      code: 'CONTENT_REPORT_NOT_FOUND',
    })
  })
})

describe('reportTargetPath', () => {
  const report = (overrides: Partial<AdminReport>) =>
    ({
      eventId: null,
      targetCode: null,
      targetKind: null,
      ...overrides,
    }) as AdminReport

  it('opens the admin screen that edits the reported content', () => {
    expect(
      reportTargetPath(
        report({ eventId: 7, targetCode: '7', targetKind: 'EVENT' }),
      ),
    ).toBe('/admin/events/7')
    expect(
      reportTargetPath(
        report({ targetCode: 'waste-food', targetKind: 'RULE' }),
      ),
    ).toBe('/admin/rules/waste-food')
    expect(
      reportTargetPath(
        report({ targetCode: 'CL-01', targetKind: 'CHECKLIST' }),
      ),
    ).toBe('/admin/guides?code=CL-01')
    expect(
      reportTargetPath(
        report({ targetCode: 'LC-01-1', targetKind: 'LIFE_CHANGE_TASK' }),
      ),
    ).toBe('/admin/guides?code=LC-01-1')
  })

  it('has nowhere to go when the target was removed', () => {
    expect(reportTargetPath(report({ eventId: 7 }))).toBeUndefined()
  })
})
