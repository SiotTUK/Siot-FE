/**
 * CB-06 entries into the chat from a detail screen, and CB-03 "current
 * conversation" of this visit so the chat tab can reopen it.
 */

/** Detail screens that can start a question. */
export const chatTopicTypes = ['event', 'rule', 'checklist'] as const

/** The detail screen a question was started from. */
export type ChatTopic = { type: (typeof chatTopicTypes)[number]; id: string }

/** Location state a detail screen passes to `/chat`. */
export interface ChatEntryState {
  chatTopic: ChatTopic
  chatDraft?: string
}

export function chatEntryState(
  topic: ChatTopic,
  draft?: string,
): ChatEntryState {
  return draft === undefined
    ? { chatTopic: topic }
    : { chatTopic: topic, chatDraft: draft }
}

const topicIds: Record<ChatTopic['type'], RegExp> = {
  event: /^[1-9]\d{0,18}$/,
  rule: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  // Checklist item codes such as CL-01 (#30).
  checklist: /^[A-Z]{2,4}-\d+(?:-\d+)*$/,
}

const topicPaths: Record<ChatTopic['type'], (id: string) => string> = {
  event: (id) => `/events/${id}`,
  rule: (id) => `/rules/${id}`,
  checklist: (id) => `/home/checklist/${id}`,
}

/** Reads untrusted location state; anything unexpected is dropped. */
export function readChatTopic(state: unknown): ChatTopic | undefined {
  if (!state || typeof state !== 'object' || !('chatTopic' in state))
    return undefined
  const topic: unknown = state.chatTopic
  if (!topic || typeof topic !== 'object') return undefined
  const { type, id } = topic as { type?: unknown; id?: unknown }
  if (
    !chatTopicTypes.includes(type as ChatTopic['type']) ||
    typeof id !== 'string'
  )
    return undefined
  const topicType = type as ChatTopic['type']
  return id.length <= 64 && topicIds[topicType].test(id)
    ? { type: topicType, id }
    : undefined
}

export function readChatDraft(state: unknown, maxLength: number) {
  if (!state || typeof state !== 'object' || !('chatDraft' in state))
    return undefined
  return typeof state.chatDraft === 'string'
    ? state.chatDraft.slice(0, maxLength)
    : undefined
}

/** Where the chat's back button returns to. */
export function chatTopicPath(topic: ChatTopic | undefined) {
  return topic ? topicPaths[topic.type](topic.id) : '/home'
}

// The current conversation lives in sessionStorage: one tab's visit, gone
// when the tab closes. It is tied to the member so another account on the
// same tab never reopens it.
const storageKey = 'siot:chat-current'

type StoredConversation = { memberId: number; conversationId: number }

function defaultStorage(): Storage | undefined {
  try {
    return sessionStorage
  } catch {
    return undefined // Node tests and blocked storage.
  }
}

function read(storage: Storage | undefined): StoredConversation | undefined {
  try {
    const value: unknown = JSON.parse(storage?.getItem(storageKey) ?? 'null')
    if (!value || typeof value !== 'object') return undefined
    const { memberId, conversationId } = value as Record<string, unknown>
    return Number.isSafeInteger(memberId) &&
      Number.isSafeInteger(conversationId) &&
      (conversationId as number) > 0
      ? {
          memberId: memberId as number,
          conversationId: conversationId as number,
        }
      : undefined
  } catch {
    return undefined
  }
}

export function currentConversation(
  memberId: number,
  storage = defaultStorage(),
) {
  const stored = read(storage)
  return stored?.memberId === memberId ? stored.conversationId : undefined
}

export function rememberConversation(
  memberId: number,
  conversationId: number,
  storage = defaultStorage(),
) {
  try {
    storage?.setItem(
      storageKey,
      JSON.stringify({ memberId, conversationId } satisfies StoredConversation),
    )
  } catch {
    /* Storage full or blocked: the chat tab just opens a new chat. */
  }
}

/**
 * Forgets the current conversation: all of it (new chat, logout, account
 * change) or only when it is the given one (that conversation was deleted).
 */
export function forgetConversation(
  conversationId?: number,
  storage = defaultStorage(),
) {
  if (
    conversationId !== undefined &&
    read(storage)?.conversationId !== conversationId
  )
    return
  try {
    storage?.removeItem(storageKey)
  } catch {
    /* Nothing stored. */
  }
}
