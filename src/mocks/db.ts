import { HttpResponse } from 'msw'
import {
  emailPattern,
  firstPasswordError,
} from '@/features/auth/password-rules'
import type { GuideTranslationResponse } from '@/features/admin/api'
import type { AdminEventDetail } from '@/features/admin/event-api'
import type { AdminRuleDetail, AdminRuleFaq } from '@/features/admin/rule-api'
import type { BillTranslation } from '@/features/bill-translation/api'
import type {
  DocumentResponse,
  DocumentVersionResponse,
} from '@/features/admin/documents'
import type { EventLeadDays } from '@/features/events/api'
import type { LifeChangeResponse } from '@/features/life-changes/api'
import type { LifeChangeCode } from '@/features/life-changes/life-changes'
import type { MessageResponse } from '@/features/chat/api'
import type { MemberResponse } from '@/shared/api/types'

/**
 * Dev/test-only mock of the BE auth + onboarding contract (docs: Swagger).
 * Never imported by production code. Fixed values for manual testing:
 * - signup verification code: 123456
 * - existing member: taken@example.com / abcd1234 (onboarded)
 * - admin: admin@example.com / admin1234 (onboarded, ADMIN)
 * - checklist text: CL-01 in ko
 * - valid reset link: /password-reset?token=mock-reset-token
 */
export const mockSignupCode = '123456'
export const mockResetToken = 'mock-reset-token'

export type MockMember = MemberResponse & { password: string }
export interface MockState {
  members: Record<string, MockMember>
  sessionEmail: string | null
  codes: Record<string, { code: string; sentAt: number; attempts: number }>
  verifiedAt: Record<string, number>
  loginFailures: Record<string, { count: number; lockedUntil: number }>
  resetSentAt: Record<string, number>
  nextId: number
  conversations: Record<string, MockConversation>
  nextChatId: number
  bills: Record<string, BillTranslation[]>
  /** ADM-02~04 chatbot source documents and their versions. */
  documents: MockDocument[]
  nextDocumentId: number
  nextBillId: number
  guides: Record<string, GuideTranslationResponse>
  /** ADM-06·RUL-04: admin rule data, seeded from the rule mock on first use. */
  adminRules?: MockAdminRules
  /** ADM-05: admin event data, seeded from the event mock on first use. */
  adminEvents?: { events: AdminEventDetail[]; nextId: number }
  /**
   * CHK-06·NTF-07 source link and contact changed by an admin, by item code.
   * Only changed fields are kept (null = cleared); the rest stay as seeded.
   */
  guideInfo?: Record<
    string,
    { sourceUrl?: string | null; contact?: string | null; updatedAt: string }
  >
  reviews: Record<
    string,
    { reviewed: boolean; adminMemo: string | null; reviewedAt: string | null }
  >
  /** member email → `code:periodKey` → mark */
  checklist: Record<string, Record<string, 'DONE' | 'NOT_APPLICABLE'>>
  lifeChanges: Record<
    string,
    Partial<Record<LifeChangeCode, LifeChangeResponse>>
  >
  /** member email → notification id → read time */
  notificationReads: Record<string, Record<number, string>>
  eventSubscriptions: Record<
    number,
    Record<string, { enabled: boolean; leadDays: EventLeadDays }>
  >
  /** member email → kind → saved preference */
  notificationPrefs: Record<
    string,
    Record<
      string,
      {
        enabled: boolean
        leadDays: number
        emailEnabled?: boolean
        leadDaysList?: number[]
      }
    >
  >
}

/** ADM-06 rules (Korean source text), categories' en/zh/vi names and FAQs. */
export interface MockAdminRules {
  rules: Record<
    string,
    AdminRuleDetail & { deletedAt: string | null; updatedAt: string | null }
  >
  categoryNames: Record<string, Partial<Record<'en' | 'zh' | 'vi', string>>>
  faqs: Omit<AdminRuleFaq, 'ruleTitle' | 'ruleDeleted'>[]
  nextFaqId: number
}

export interface MockConversation {
  conversationId: number
  ownerEmail: string
  language: string
  createdAt: string
  updatedAt: string
  messages: MessageResponse[]
  /** CB-04 comment by answer id; kept apart because messages do not return it. */
  feedbackComments?: Record<number, string>
}

const storageKey = 'siot:mock-state'

function seedState(): MockState {
  return {
    members: {
      'taken@example.com': {
        id: 1,
        email: 'taken@example.com',
        password: 'abcd1234',
        role: 'USER',
        language: 'ko',
        userType: 'LIVING',
        entryDate: null,
        purpose: 'WORK',
        residences: [],
        stayExpiry: null,
        emailVerified: true,
        onboarded: true,
      },
      'admin@example.com': {
        id: 2,
        email: 'admin@example.com',
        password: 'admin1234',
        role: 'ADMIN',
        language: 'ko',
        userType: 'LIVING',
        entryDate: null,
        purpose: 'OTHER',
        residences: [],
        stayExpiry: null,
        emailVerified: true,
        onboarded: true,
      },
    },
    sessionEmail: null,
    codes: {},
    verifiedAt: {},
    loginFailures: {},
    resetSentAt: {},
    nextId: 3,
    // Sample answers for the admin review screen (ADM-08).
    conversations: {
      '1': {
        conversationId: 1,
        ownerEmail: 'taken@example.com',
        language: 'ko',
        createdAt: '2026-11-19T02:00:00Z',
        updatedAt: '2026-11-19T02:01:00Z',
        messages: [
          seedMessage(1, 'USER', '자동차세는 언제 내요?', null, null),
          seedMessage(
            2,
            'ASSISTANT',
            '자동차세는 6월과 12월에 내요.',
            'ANSWERED',
            false,
          ),
          seedMessage(3, 'USER', '시흥에서 제일 맛있는 식당은?', null, null),
          seedMessage(
            4,
            'ASSISTANT',
            '자료에서 찾지 못했어요. 추측해서 답하지 않을게요.',
            'NO_EVIDENCE',
            null,
          ),
        ],
      },
    },
    nextChatId: 2,
    bills: {},
    nextBillId: 1,
    documents: [seedDocument()],
    nextDocumentId: 2,
    guides: {
      'CL-01:ko': {
        code: 'CL-01',
        language: 'ko',
        title: '외국인등록',
        summary: '입국 후 90일 안에 관할 출입국·외국인관서에서 신청',
        content: null,
        badge: '입국 후 90일 이내',
        place: '관할 출입국·외국인관서',
        docs: ['여권', '사진 1장'],
        fee: '30,000원',
        law: '출입국관리법 제31조',
        penalty: '과태료',
        sourceName: '하이코리아',
        noticeChangedAt: null,
        updatedAt: '2026-11-14T00:00:00Z',
        pageStart: 12,
        pageEnd: 14,
        sourcePages: 'p.12~14',
        points: [],
        when: null,
        contact: null,
        reviewed: false,
      },
    },
    reviews: {},
    checklist: {},
    lifeChanges: {},
    notificationReads: {},
    eventSubscriptions: {},
    notificationPrefs: {},
  }
}

function loadState(): MockState {
  try {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) {
      const state = JSON.parse(saved) as MockState
      state.checklist ??= {}
      state.lifeChanges ??= {}
      state.notificationReads ??= {}
      state.eventSubscriptions ??= {}
      state.notificationPrefs ??= {}
      state.bills ??= {}
      state.nextBillId ??= 1
      state.documents ??= [seedDocument()]
      state.nextDocumentId ??= 2
      return state
    }
  } catch {
    /* Node tests have no sessionStorage. */
  }
  return seedState()
}

// Live binding: handler modules always see the current state.
export let state = loadState()

export function persist() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    /* Node tests have no sessionStorage. */
  }
}

/** Tests call this between cases. */
export function resetMockState() {
  state = seedState()
  persist()
}

export const error = (
  status: number,
  code: string,
  message: string,
  details?: object,
) =>
  HttpResponse.json({ code, message, ...(details && { details }) }, { status })

export const normalize = (email: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

export function isEmail(email: string) {
  return email.length <= 255 && emailPattern.test(email)
}

export function publicMember(member: MockMember): MemberResponse {
  const copy: Partial<MockMember> = { ...member }
  delete copy.password
  return copy as MemberResponse
}

export function currentMember(): MockMember | undefined {
  return state.sessionEmail ? state.members[state.sessionEmail] : undefined
}

export const unauthorized = () =>
  error(401, 'UNAUTHORIZED', '로그인이 필요합니다.')

/** BE checks rules in order and reports only the first violation. */
export function passwordError(
  password: unknown,
  confirm: unknown,
  email: string,
) {
  if (typeof password !== 'string' || typeof confirm !== 'string')
    return 'INVALID_INPUT'
  const key = firstPasswordError(password, email)
  if (key === 'validation.passwordRequired') return 'PASSWORD_LENGTH'
  if (key) return key.replace('errors.', '')
  if (!/^[\x21-\x7e]+$/.test(password)) return 'PASSWORD_INVALID_CHARACTER'
  if (password !== confirm) return 'PASSWORD_CONFIRM_MISMATCH'
  return undefined
}

export const languages = ['ko', 'en', 'zh', 'vi'] as const
export const toLanguage = (value: unknown) =>
  languages.find((language) => language === value) ?? 'ko'

export async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json()
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function page<T>(rows: T[], url: URL) {
  const page = Number(url.searchParams.get('page') ?? 0)
  const size = Number(url.searchParams.get('size') ?? 20)
  return {
    content: rows.slice(page * size, page * size + size),
    page,
    size,
    totalElements: rows.length,
    totalPages: Math.ceil(rows.length / size),
    hasNext: (page + 1) * size < rows.length,
  }
}

export function seedMessage(
  messageId: number,
  role: MessageResponse['role'],
  content: string,
  answerStatus: MessageResponse['answerStatus'],
  helpful: boolean | null,
): MessageResponse {
  return {
    messageId,
    role,
    content,
    answerStatus,
    sources: [],
    relatedPages: [],
    emergencyContacts: [],
    referral: null,
    helpful,
    createdAt: `2026-11-19T02:0${messageId}:00Z`,
  }
}

export type MockDocument = Omit<
  DocumentResponse,
  'currentVersion' | 'latestVersion'
> & { versions: DocumentVersionResponse[] }

/** One indexed document, like a BE that already holds the city guide. */
function seedDocument(): MockDocument {
  return {
    documentId: 1,
    name: '시흥시 외국인주민 생활안내',
    sourceUrl: 'https://www.siheung.go.kr/guide.pdf',
    publishedOn: '2026-03-01',
    active: true,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    versions: [
      {
        versionId: 1,
        documentId: 1,
        versionNo: 1,
        originalFilename: 'guide-2026.pdf',
        changeType: 'NEW',
        changeSummary: null,
        excludedPages: '51-52',
        status: 'COMPLETED',
        current: true,
        failedStage: null,
        failureReason: null,
        chunkCount: 184,
        uploadedBy: 2,
        uploadedAt: '2026-11-20T00:00:00Z',
        processedAt: '2026-11-20T00:05:00Z',
      },
    ],
  }
}
