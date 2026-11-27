import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

export type BillDocumentType =
  'TAX_NOTICE' | 'DEMAND_NOTICE' | 'ARREARS_NOTICE' | 'UTILITY' | 'OTHER'
export type RetakeReason = 'BLURRY' | 'CROPPED' | 'NOT_A_BILL'

export interface RelatedBillGuide {
  code: string
  kind: 'CHECKLIST' | 'RULE' | 'LIFE_CHANGE_TASK'
  title: string
}

export interface BillTranslation {
  language: Language
  readable: boolean
  retake: { reason: RetakeReason; message: string } | null
  documentType: BillDocumentType | null
  issuer: string | null
  taxType: string | null
  taxObject: string | null
  amount: number | null
  dueDate: string | null
  lateAmount: number | null
  lateDueDate: string | null
  penalty: number | null
  paymentMethods: string[]
  contact: string | null
  originalLines: string[]
  summary: {
    what: string
    due: string
    amount: string
    howToPay: string
  } | null
  summarySource: 'AI' | 'SERVER' | null
  warnings: { code: string; message: string }[]
  relatedGuides: RelatedBillGuide[]
  firstPageOnly: boolean
  pageCount: number
  id: number | null
  reminder: boolean
  savedAt: string | null
}

export type RecentBillTranslation = Pick<
  BillTranslation,
  | 'language'
  | 'documentType'
  | 'issuer'
  | 'taxType'
  | 'amount'
  | 'dueDate'
  | 'reminder'
> & {
  id: number
  what: string | null
  reminderAvailable: boolean
  savedAt: string
}

const path = '/api/translations/bills'
export const billKeys = {
  all: ['bill-translations'] as const,
  list: (memberId: number) => [...billKeys.all, memberId, 'list'] as const,
  detail: (memberId: number, id: number) =>
    [...billKeys.all, memberId, 'detail', id] as const,
}

export function translateBill(
  {
    file,
    language,
    consent,
    remind,
  }: { file: File; language: Language; consent: boolean; remind?: boolean },
  signal?: AbortSignal,
  isRequestCurrent?: () => boolean,
) {
  const body = new FormData()
  body.set('file', file)
  body.set('consent', String(consent))
  body.set('language', language)
  if (remind !== undefined) body.set('remind', String(remind))
  return apiRequest<BillTranslation>(path, {
    method: 'POST',
    body,
    signal,
    isRequestCurrent,
  })
}

export function listBillTranslations(signal?: AbortSignal) {
  return apiRequest<RecentBillTranslation[]>(path, { signal })
}

export function getBillTranslation(id: number, signal?: AbortSignal) {
  return apiRequest<BillTranslation>(`${path}/${id}`, { signal })
}

export function changeBillReminder(
  id: number,
  enabled: boolean,
  isRequestCurrent?: () => boolean,
) {
  return apiRequest<BillTranslation>(`${path}/${id}/reminder`, {
    method: 'PUT',
    body: { enabled },
    isRequestCurrent,
  })
}

export function deleteBillTranslation(
  id: number,
  isRequestCurrent?: () => boolean,
) {
  return apiRequest(`${path}/${id}`, { method: 'DELETE', isRequestCurrent })
}
