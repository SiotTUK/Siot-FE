import { http, HttpResponse } from 'msw'
import {
  reportStatuses,
  type AdminReport,
  type ReportReason,
} from '@/features/admin/report-api'
import type { Language } from '@/shared/api/types'
import { body, currentMember, error, page, persist, state } from '../db'
import { requireAdmin } from './admin'

/** ADM-07 admin report APIs. Dev/test only. */
function data(): NonNullable<typeof state.adminReports> {
  state.adminReports ??= { reports: seedReports(), nextId: 100 }
  return state.adminReports
}

function seedReports(): AdminReport[] {
  const base = {
    reporterUserId: 1,
    description: null,
    adminMemo: null,
    processedBy: null,
    processedAt: null,
  }
  return [
    {
      ...base,
      reportId: 3,
      eventId: null,
      guideId: 11,
      targetType: 'RULE',
      targetTitleSnapshot: '음식물 쓰레기 배출',
      quotedText: '음식물 쓰레기는 일반 종량제 봉투에 버려요',
      language: 'en',
      reason: 'CONTENT',
      description: '시흥시는 음식물 전용 봉투를 써야 해요.',
      status: 'RECEIVED',
      createdAt: '2026-11-27T10:20:00+09:00',
      updatedAt: '2026-11-27T10:20:00+09:00',
      targetCode: 'waste-food',
      targetKind: 'RULE',
    },
    {
      ...base,
      reportId: 2,
      eventId: null,
      guideId: 21,
      targetType: 'RULE',
      targetTitleSnapshot: '외국인등록',
      quotedText: 'Fee 30,000 won',
      language: 'en',
      reason: 'TRANSLATION',
      status: 'IN_REVIEW',
      adminMemo: '수수료 최신 금액 확인 중',
      processedBy: 2,
      processedAt: '2026-11-26T15:00:00+09:00',
      createdAt: '2026-11-26T09:00:00+09:00',
      updatedAt: '2026-11-26T15:00:00+09:00',
      targetCode: 'CL-01',
      targetKind: 'CHECKLIST',
    },
    {
      ...base,
      reportId: 1,
      eventId: 404,
      guideId: null,
      // The event was removed after the report.
      targetType: 'EVENT',
      targetTitleSnapshot: '2026 시흥 다문화 축제',
      quotedText: '장소: 시흥시청 광장',
      language: 'vi',
      reason: 'OTHER',
      status: 'RESOLVED',
      adminMemo: '행사 취소로 삭제함',
      processedBy: 2,
      processedAt: '2026-11-21T11:00:00+09:00',
      createdAt: '2026-11-20T18:30:00+09:00',
      updatedAt: '2026-11-21T11:00:00+09:00',
      targetCode: null,
      targetKind: null,
    },
  ]
}

/** COM-01 `POST /api/reports` (already validated) as the admin sees it. */
export function recordReport(
  reporterUserId: number,
  input: Record<string, unknown>,
  koreanTitle: string | null,
): AdminReport {
  const store = data()
  const now = new Date().toISOString()
  const event = typeof input.guideCode !== 'string'
  const snapshot =
    typeof input.targetTitleSnapshot === 'string'
      ? input.targetTitleSnapshot.trim()
      : ''
  const description =
    typeof input.description === 'string' ? input.description.trim() : ''
  const report: AdminReport = {
    reportId: store.nextId++,
    reporterUserId,
    eventId: event ? Number(input.eventId) : null,
    guideId: event ? null : 1,
    targetType: event ? 'EVENT' : 'RULE',
    targetTitleSnapshot: snapshot || koreanTitle,
    quotedText: String(input.quotedText).trim(),
    language: (input.language as Language | undefined) ?? 'ko',
    reason: input.reason as ReportReason,
    description: description || null,
    status: 'RECEIVED',
    adminMemo: null,
    processedBy: null,
    processedAt: null,
    createdAt: now,
    updatedAt: now,
    targetCode: event ? String(input.eventId) : String(input.guideCode),
    targetKind: event ? 'EVENT' : 'RULE',
  }
  store.reports.push(report)
  persist()
  return report
}

const notFound = () =>
  error(404, 'CONTENT_REPORT_NOT_FOUND', '신고를 찾을 수 없습니다.')
const invalid = () =>
  error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
const statusOf = (value: unknown) => {
  const status = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return reportStatuses.find((item) => item === status)
}
const find = (reportId: unknown) =>
  data().reports.find((report) => report.reportId === Number(reportId))

export const adminReportHandlers = [
  http.get('*/api/admin/reports', ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const url = new URL(request.url)
    const raw = url.searchParams.get('status')?.trim() ?? ''
    const all = !raw || raw.toUpperCase() === 'ALL'
    const status = statusOf(raw)
    if (!all && !status) return invalid()
    const rows = data()
      .reports.filter((report) => all || report.status === status)
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.reportId - a.reportId,
      )
    return HttpResponse.json({ data: page(rows, url) })
  }),

  http.get('*/api/admin/reports/:reportId', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const report = find(params.reportId)
    return report ? HttpResponse.json({ data: report }) : notFound()
  }),

  http.patch('*/api/admin/reports/:reportId', async ({ request, params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const report = find(params.reportId)
    if (!report) return notFound()
    const input = await body(request)
    const status = statusOf(input.status)
    const memo = input.adminMemo
    if (
      !status ||
      (memo != null && (typeof memo !== 'string' || memo.length > 2000))
    )
      return invalid()
    const now = new Date().toISOString()
    Object.assign(report, {
      status,
      adminMemo: typeof memo === 'string' && memo.trim() ? memo.trim() : null,
      processedBy: currentMember()?.id ?? null,
      processedAt: now,
      updatedAt: now,
    })
    persist()
    return HttpResponse.json({ data: report })
  }),
]
