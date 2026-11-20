import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'

/** CB-03 conversation. `title` is the first (masked) question, null before any. */
export interface ConversationResponse {
  conversationId: number
  language: Language
  title: string | null
  createdAt: string
  updatedAt: string
}

/** CB-17 evidence. Only `documentName` shows until the chip is opened. */
export interface SourceResponse {
  order: number
  documentName: string | null
  pageStart: number | null
  pageEnd: number | null
  sourceUrl: string | null
  relevanceScore: number | null
}

/** CB-10 related service screen. */
export interface RelatedPage {
  type: 'CHECKLIST' | 'LIFE_CHANGE_TASK' | 'RULE' | 'EVENT'
  code: string
  title: string
}

/** CB-09 emergency number shown above the answer. */
export interface EmergencyContact {
  number: string
  label: string
}

/** CB-11 "we cannot judge your case" notice with the agencies to call. */
export interface Referral {
  notice: string
  contacts: {
    topic: 'VISA' | 'LEGAL' | 'MEDICAL'
    number: string
    label: string
  }[]
}

export type AnswerStatus = 'ANSWERED' | 'NO_EVIDENCE' | 'ERROR'

export interface MessageResponse {
  messageId: number
  role: 'USER' | 'ASSISTANT'
  content: string
  /** Answers only; null for questions. */
  answerStatus: AnswerStatus | null
  sources: SourceResponse[]
  relatedPages: RelatedPage[]
  emergencyContacts: EmergencyContact[]
  referral: Referral | null
  /** CB-04 rating; null before rating. */
  helpful: boolean | null
  createdAt: string
  /** Client only: this question was masked when sent (from AskResponse.masked). */
  masked?: boolean
}

export interface AskResponse {
  question: MessageResponse
  answer: MessageResponse
  /** Personal data was masked in the stored question (CB-05). */
  masked: boolean
}

export interface SuggestionsResponse {
  userType: 'NEW' | 'LIVING' | null
  language: Language
  questions: string[]
}

export const questionMaxLength = 1000

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: number) =>
    [...chatKeys.all, 'messages', conversationId] as const,
  suggestions: (language: Language) =>
    [...chatKeys.all, 'suggestions', language] as const,
}

export function fetchConversations(page: number, size = 20) {
  return apiRequest<PageResponse<ConversationResponse>>(
    `/api/chat/conversations?page=${page}&size=${size}`,
  )
}

export function createConversation(language: Language) {
  return apiRequest<ConversationResponse>('/api/chat/conversations', {
    method: 'POST',
    body: { language },
  })
}

export function fetchMessages(conversationId: number) {
  return apiRequest<MessageResponse[]>(
    `/api/chat/conversations/${conversationId}/messages`,
  )
}

export function askQuestion(conversationId: number, content: string) {
  return apiRequest<AskResponse>(
    `/api/chat/conversations/${conversationId}/messages`,
    { method: 'POST', body: { content } },
  )
}

export function deleteConversation(conversationId: number) {
  return apiRequest(`/api/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}

export function sendFeedback(
  conversationId: number,
  messageId: number,
  helpful: boolean,
) {
  return apiRequest(
    `/api/chat/conversations/${conversationId}/messages/${messageId}/feedback`,
    { method: 'PUT', body: { helpful } },
  )
}

export function fetchSuggestions(language: Language) {
  return apiRequest<SuggestionsResponse>(
    `/api/chat/suggestions?language=${language}`,
  )
}
