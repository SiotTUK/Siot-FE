/**
 * #29 bill result cards in the chat. The chat API knows nothing about them, so
 * only the translation id and where the card sits are kept in sessionStorage;
 * the bill itself is read from the server again. Like the current conversation,
 * the list is tied to the member so another account never sees it.
 */

export interface ChatBillCard {
  translationId: number
  /** null: added to a new chat that has no question yet. */
  conversationId: number | null
  /** The message the card follows; null puts it before the first one. */
  afterMessageId: number | null
}

export type ChatBillPosition = Omit<ChatBillCard, 'translationId'>

const storageKey = 'siot:chat-bills'
const maxCards = 20

function defaultStorage(): Storage | undefined {
  try {
    return sessionStorage
  } catch {
    return undefined // Node tests and blocked storage.
  }
}

const isId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) > 0
const isIdOrNull = (value: unknown): value is number | null =>
  value === null || isId(value)

function read(memberId: number, storage: Storage | undefined): ChatBillCard[] {
  try {
    const value: unknown = JSON.parse(storage?.getItem(storageKey) ?? 'null')
    if (!value || typeof value !== 'object') return []
    const stored = value as { memberId?: unknown; cards?: unknown }
    if (stored.memberId !== memberId || !Array.isArray(stored.cards)) return []
    return stored.cards.flatMap((card: unknown) => {
      const { translationId, conversationId, afterMessageId } = (card ??
        {}) as Record<string, unknown>
      return isId(translationId) &&
        isIdOrNull(conversationId) &&
        isIdOrNull(afterMessageId)
        ? [{ translationId, conversationId, afterMessageId }]
        : []
    })
  } catch {
    return []
  }
}

function write(
  memberId: number,
  cards: ChatBillCard[],
  storage: Storage | undefined,
) {
  try {
    storage?.setItem(storageKey, JSON.stringify({ memberId, cards }))
  } catch {
    /* Storage full or blocked: the result stays in recent translations. */
  }
}

/** The cards of one conversation, oldest first; null is the new chat. */
export function billCards(
  memberId: number,
  conversationId: number | null,
  storage = defaultStorage(),
) {
  return read(memberId, storage).filter(
    (card) => card.conversationId === conversationId,
  )
}

export function addBillCard(
  memberId: number,
  card: ChatBillCard,
  storage = defaultStorage(),
) {
  const others = read(memberId, storage).filter(
    (item) => item.translationId !== card.translationId,
  )
  write(memberId, [...others, card].slice(-maxCards), storage)
}

/** The first question created the conversation: the new chat's cards join it. */
export function linkNewBillCards(
  memberId: number,
  conversationId: number,
  storage = defaultStorage(),
) {
  const cards = read(memberId, storage)
  if (!cards.some((card) => card.conversationId === null)) return
  write(
    memberId,
    cards.map((card) =>
      card.conversationId === null ? { ...card, conversationId } : card,
    ),
    storage,
  )
}

/** "새 대화": the unfinished new chat is left behind with its cards. */
export function dropNewBillCards(memberId: number, storage = defaultStorage()) {
  const cards = read(memberId, storage)
  const kept = cards.filter((card) => card.conversationId !== null)
  if (kept.length !== cards.length) write(memberId, kept, storage)
}

/**
 * Forgets all cards (logout, account change, expired session) or only those of
 * the given conversation (it was deleted).
 */
export function forgetBillCards(
  conversationId?: number,
  storage = defaultStorage(),
) {
  try {
    if (conversationId === undefined) {
      storage?.removeItem(storageKey)
      return
    }
    const value = JSON.parse(storage?.getItem(storageKey) ?? 'null') as {
      memberId?: unknown
    } | null
    const memberId = value?.memberId
    if (typeof memberId !== 'number') return
    write(
      memberId,
      read(memberId, storage).filter(
        (card) => card.conversationId !== conversationId,
      ),
      storage,
    )
  } catch {
    /* Nothing stored. */
  }
}

/**
 * Splits the cards by the message they follow, keeping their order. A card
 * whose message is not in the list goes last instead of disappearing.
 */
export function placeBillCards(cards: ChatBillCard[], messageIds: number[]) {
  const first: ChatBillCard[] = []
  const after = new Map<number, ChatBillCard[]>()
  const last = messageIds.at(-1)
  for (const card of cards) {
    const anchor =
      card.afterMessageId === null || messageIds.includes(card.afterMessageId)
        ? card.afterMessageId
        : (last ?? null)
    if (anchor === null) first.push(card)
    else after.set(anchor, [...(after.get(anchor) ?? []), card])
  }
  return { first, after }
}
