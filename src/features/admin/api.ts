import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'

export type Role = 'USER' | 'ADMIN'

/** Same shape as the chat answer source (CB-17). */
export interface ReviewSource {
  order: number
  documentName: string | null
  pageStart: number | null
  pageEnd: number | null
  sourceUrl: string | null
  relevanceScore: number | null
}

/** ADM-01 member row. */
export interface AdminMemberResponse {
  id: number
  email: string
  role: Role
  createdAt: string
}

export type ReviewType = 'ALL' | 'NEGATIVE' | 'NO_EVIDENCE'

/** ADM-08 answer to review. Masked text only, no member identity. */
export interface ChatReviewResponse {
  messageId: number
  conversationId: number
  language: string
  reason: 'NEGATIVE' | 'NO_EVIDENCE'
  question: string | null
  answer: string
  answerStatus: 'ANSWERED' | 'NO_EVIDENCE' | 'ERROR'
  helpful: boolean | null
  feedbackComment: string | null
  sources: ReviewSource[]
  reviewed: boolean
  adminMemo: string | null
  reviewedBy: number | null
  reviewedAt: string | null
  createdAt: string
}

/** CHK-06 one language of a checklist item's detail text. */
export interface GuideTranslationResponse {
  code: string
  language: Language
  title: string
  summary: string | null
  content: string | null
  badge: string | null
  place: string | null
  docs: string[]
  fee: string | null
  law: string | null
  penalty: string | null
  sourceName: string | null
  noticeChangedAt: string | null
  updatedAt: string
  /** CHK-06 source booklet pages. */
  pageStart: number | null
  pageEnd: number | null
  /** Server text, e.g. "p.12~14". */
  sourcePages: string | null
  /** #14 life-rule sentences in order; empty for checklist items (BE #23). */
  points: string[]
  when: string | null
  /** null = the screen uses the item's shared contact number. */
  contact: string | null
  /** true = human-checked translation; auto-translation will not overwrite it. */
  reviewed: boolean
}

/** PUT replaces everything: omitted or empty fields are cleared. */
export interface GuideTranslationUpdateRequest {
  title: string
  summary: string | null
  content: string | null
  badge: string | null
  place: string | null
  docs: string[]
  fee: string | null
  law: string | null
  penalty: string | null
  sourceName: string | null
  /** true = real guidance change (shows "변경됨"), false = typo fix (NTF-07). */
  noticeChanged: boolean
}

export type GuideKind = 'CHECKLIST' | 'LIFE_CHANGE_TASK' | 'RULE'

/** CHK-06 `GET /api/admin/guides`: items to pick for text editing. */
export interface GuideSummaryResponse {
  code: string
  kind: GuideKind
  /** Korean title; null when the item has no Korean text. */
  title: string | null
  category: string | null
  lifeChangeCode: string | null
}

/** ADM-08 search: answer number and/or text (masked text, ignoring case). */
export interface ReviewSearch {
  messageId?: number
  keyword?: string
}

/** CHK-06·NTF-07 language-independent values of an item. */
export interface GuideInfoResponse {
  code: string
  kind: GuideKind
  sourceUrl: string | null
  contact: string | null
  updatedAt: string | null
}

/**
 * PATCH: an omitted field stays as it is, an empty string clears it.
 * `sourceUrl` must start with http:// or https:// (BE checks it too).
 */
export interface GuideInfoUpdateRequest {
  sourceUrl?: string
  contact?: string
}

export const adminKeys = {
  all: ['admin'] as const,
  members: (email: string, role: Role | '') =>
    [...adminKeys.all, 'members', email, role] as const,
  reviews: (
    type: ReviewType,
    reviewed: boolean | undefined,
    search: ReviewSearch = {},
  ) =>
    [
      ...adminKeys.all,
      'reviews',
      type,
      reviewed ?? 'any',
      search.messageId ?? '',
      search.keyword ?? '',
    ] as const,
  guides: () => [...adminKeys.all, 'guides'] as const,
  guideAll: (code: string) => [...adminKeys.all, 'guide', code] as const,
  guide: (code: string, language: Language) =>
    [...adminKeys.guideAll(code), language] as const,
  guideInfo: (code: string) => [...adminKeys.all, 'guide-info', code] as const,
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== '') search.set(key, String(value))
  return search.toString()
}

export function searchMembers(email: string, role: Role | '', page: number) {
  return apiRequest<PageResponse<AdminMemberResponse>>(
    `/api/admin/members?${query({ email, role, page, size: 20 })}`,
  )
}

export function changeRole(memberId: number, role: Role) {
  return apiRequest<AdminMemberResponse>(
    `/api/admin/members/${memberId}/role`,
    { method: 'PUT', body: { role } },
  )
}

export function fetchReviews(
  type: ReviewType,
  reviewed: boolean | undefined,
  page: number,
  search: ReviewSearch = {},
) {
  const { messageId, keyword } = search
  return apiRequest<PageResponse<ChatReviewResponse>>(
    `/api/admin/chat/reviews?${query({ type, reviewed, messageId, keyword, page, size: 20 })}`,
  )
}

export function updateReview(
  messageId: number,
  body: { reviewed: boolean; adminMemo: string | null },
) {
  return apiRequest<ChatReviewResponse>(
    `/api/admin/chat/reviews/${messageId}`,
    { method: 'PATCH', body },
  )
}

/** Not deleted items: checklist, then life change tasks, then rules. */
export function fetchGuides() {
  return apiRequest<GuideSummaryResponse[]>('/api/admin/guides')
}

const guidePath = (code: string, language: Language) =>
  `/api/admin/guides/${encodeURIComponent(code)}/translations/${language}` as const

export function fetchGuideTranslation(code: string, language: Language) {
  return apiRequest<GuideTranslationResponse>(guidePath(code, language))
}

const guideInfoPath = (code: string) =>
  `/api/admin/guides/${encodeURIComponent(code)}` as const

export function fetchGuideInfo(code: string) {
  return apiRequest<GuideInfoResponse>(guideInfoPath(code))
}

export function updateGuideInfo(code: string, body: GuideInfoUpdateRequest) {
  return apiRequest<GuideInfoResponse>(guideInfoPath(code), {
    method: 'PATCH',
    body,
  })
}

export function saveGuideTranslation(
  code: string,
  language: Language,
  body: GuideTranslationUpdateRequest,
) {
  return apiRequest<GuideTranslationResponse>(guidePath(code, language), {
    method: 'PUT',
    body,
  })
}
