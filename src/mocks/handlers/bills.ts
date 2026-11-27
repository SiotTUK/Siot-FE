import { delay, http, HttpResponse } from 'msw'
import type {
  BillTranslation,
  RecentBillTranslation,
  RetakeReason,
} from '@/features/bill-translation/api'
import {
  maxBillBytes,
  pdfType,
  photoTypes,
} from '@/features/bill-translation/bill-translation'
import { isLanguage } from '@/shared/i18n'
import { koreaToday } from '@/shared/i18n/format'
import { body, currentMember, error, persist, state, unauthorized } from '../db'

const path = '*/api/translations/bills'
const notFound = () =>
  error(404, 'BILL_TRANSLATION_NOT_FOUND', '번역 기록을 찾을 수 없습니다.')
const invalid = () =>
  error(400, 'BILL_FILE_INVALID', 'JPG, PNG, PDF 파일만 올릴 수 있습니다.')
const canRemind = ({ dueDate }: BillTranslation) =>
  !!dueDate && dueDate >= koreaToday()

function listItem(bill: BillTranslation): RecentBillTranslation {
  const {
    id,
    language,
    documentType,
    issuer,
    taxType,
    amount,
    dueDate,
    reminder,
    savedAt,
  } = bill
  return {
    id: id!,
    language,
    documentType,
    issuer,
    taxType,
    amount,
    dueDate,
    reminder,
    what: bill.summary?.what ?? null,
    savedAt: savedAt!,
    reminderAvailable: canRemind(bill),
  }
}

const sample = {
  ko: [
    '자동차세 고지서예요.',
    '고지서에 표시된 기한까지 내세요.',
    '123,450원이에요.',
    '위택스',
    '기한이 지나면 가산세가 붙을 수 있어요.',
    '자동차세 내기',
  ],
  en: [
    'This is a vehicle tax notice.',
    'Pay by the deadline on the notice.',
    'The amount is KRW 123,450.',
    'Wetax',
    'Late payment may incur a penalty.',
    'Pay vehicle tax',
  ],
  zh: [
    '这是汽车税缴费通知。',
    '请在通知单上标明的期限内缴纳。',
    '应缴金额为 123,450 韩元。',
    'Wetax',
    '逾期缴费可能产生滞纳金。',
    '缴纳汽车税',
  ],
  vi: [
    'Đây là thông báo nộp thuế xe.',
    'Hãy nộp trước hạn ghi trên thông báo.',
    'Số tiền là 123.450 won.',
    'Wetax',
    'Nộp trễ có thể bị phạt.',
    'Nộp thuế xe',
  ],
}

function fixture(
  file: File,
  language: BillTranslation['language'],
): BillTranslation {
  const [what, due, amount, howToPay, warning, title] = sample[language]
  // The mock uses filenames to exercise states without sending documents to an AI.
  const reason = (['BLURRY', 'CROPPED', 'NOT_A_BILL'] as const).find((value) =>
    file.name.toUpperCase().startsWith(value),
  )
  const readable = !reason
  const firstPageOnly = file.type === pdfType && file.name.startsWith('multi')
  const date = new Date(Date.now() + 14 * 86_400_000)
  const dueDate = file.name.startsWith('no-deadline') ? null : koreaToday(date)
  return {
    language,
    readable,
    retake: reason ? { reason: reason as RetakeReason, message: reason } : null,
    documentType: readable ? 'TAX_NOTICE' : null,
    issuer: readable ? '시흥시' : null,
    taxType: readable ? '자동차세' : null,
    taxObject: null,
    amount: readable ? 123450 : null,
    dueDate: readable ? dueDate : null,
    lateAmount: null,
    lateDueDate: null,
    penalty: null,
    contact: null,
    paymentMethods: readable ? [howToPay] : [],
    originalLines: readable ? ['자동차세 123,450원', '납부 방법: 위택스'] : [],
    summary: readable
      ? { what, due: dueDate ? due : '', amount, howToPay }
      : null,
    summarySource: readable ? 'AI' : null,
    warnings: readable ? [{ code: 'LATE_PENALTY', message: warning }] : [],
    relatedGuides: readable
      ? [{ code: 'CL-10', kind: 'CHECKLIST', title }]
      : [],
    // Like the BE: the kind from the tax type, and no round because the mock
    // has no common car tax schedule (only the resident tax, id 1).
    taxKind: readable ? 'TAX_CAR' : null,
    taxScheduleId: null,
    firstPageOnly,
    pageCount: firstPageOnly ? 2 : 1,
    id: null,
    reminder: false,
    savedAt: null,
  }
}

export const billHandlers = [
  http.post(path, async ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const input = await request.formData().catch(() => null)
    if (!input) return invalid()
    if (String(input.get('consent')).toLowerCase() !== 'true')
      return error(
        400,
        'BILL_CONSENT_REQUIRED',
        '외부 AI 전송에 동의해 주세요.',
      )
    const file = input.get('file')
    if (!(file instanceof File) || file.size === 0) return invalid()
    if (file.size > maxBillBytes)
      return error(413, 'BILL_FILE_TOO_LARGE', '파일이 너무 큽니다.')
    if (![...photoTypes.split(','), pdfType].includes(file.type))
      return invalid()
    const language = input.get('language') || member.language
    if (!isLanguage(language))
      return error(400, 'INVALID_INPUT', '지원하지 않는 언어입니다.')
    if (file.name.startsWith('ai-unavailable'))
      return error(503, 'AI_UNAVAILABLE', 'AI를 사용할 수 없습니다.')
    if (file.name.startsWith('too-frequent'))
      return error(
        429,
        'BILL_TRANSLATION_TOO_FREQUENT',
        '요청이 너무 잦습니다.',
      )
    if (file.name.startsWith('rate-limit'))
      return error(
        429,
        'BILL_TRANSLATION_LIMIT',
        '시간당 번역 한도를 초과했습니다.',
      )
    if (file.name.startsWith('slow')) await delay(12_000)
    else if (typeof window !== 'undefined') await delay(800)
    request.signal.throwIfAborted()
    const result = fixture(file, language)
    if (!result.readable) return HttpResponse.json({ data: result })
    result.id = state.nextBillId++
    result.savedAt = new Date().toISOString()
    result.reminder =
      String(input.get('remind')).toLowerCase() === 'true' && canRemind(result)
    const previous = state.bills[member.email] ?? []
    state.bills[member.email] = [result, ...previous].filter(
      (bill, index) => index < 10 || (bill.reminder && canRemind(bill)),
    )
    persist()
    return HttpResponse.json({ data: result })
  }),
  http.get(path, () => {
    const member = currentMember()
    if (!member) return unauthorized()
    return HttpResponse.json({
      data: (state.bills[member.email] ?? []).slice(0, 10).map(listItem),
    })
  }),
  http.get(`${path}/:id`, ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const result = state.bills[member.email]?.find(
      (bill) => bill.id === Number(params.id),
    )
    return result ? HttpResponse.json({ data: result }) : notFound()
  }),
  http.put(`${path}/:id/reminder`, async ({ params, request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const { enabled } = await body(request)
    if (typeof enabled !== 'boolean')
      return error(400, 'INVALID_INPUT', '알림 설정 값이 필요합니다.')
    const result = state.bills[member.email]?.find(
      (bill) => bill.id === Number(params.id),
    )
    if (!result) return notFound()
    if (enabled && !canRemind(result))
      return error(
        400,
        'BILL_REMINDER_UNAVAILABLE',
        '마감 알림을 켤 수 없습니다.',
      )
    result.reminder = enabled
    persist()
    return HttpResponse.json({ data: result })
  }),
  http.delete(`${path}/:id`, ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const bills = state.bills[member.email] ?? []
    const remaining = bills.filter((bill) => bill.id !== Number(params.id))
    if (remaining.length === bills.length) return notFound()
    state.bills[member.email] = remaining
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]
