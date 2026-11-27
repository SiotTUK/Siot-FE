import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query-client'
import { ApiError } from '@/shared/api/client'
import {
  addBillCard,
  billCards,
  dropNewBillCards,
  forgetBillCards,
  linkNewBillCards,
  placeBillCards,
} from './chat-bill-cards'

const items = new Map<string, string>()
const storage = {
  getItem: (key: string) => items.get(key) ?? null,
  setItem: (key: string, value: string) => void items.set(key, value),
  removeItem: (key: string) => void items.delete(key),
} as Storage

const card = (
  translationId: number,
  conversationId: number | null,
  afterMessageId: number | null = null,
) => ({ translationId, conversationId, afterMessageId })

beforeEach(() => items.clear())
afterEach(() => vi.unstubAllGlobals())

describe('bill cards of the chat', () => {
  it('stores only the translation id and its place, then restores them', () => {
    addBillCard(1, card(5, 10, 1001), storage)
    addBillCard(1, card(6, 11), storage)

    expect(JSON.parse(items.get('siot:chat-bills')!)).toEqual({
      memberId: 1,
      cards: [card(5, 10, 1001), card(6, 11)],
    })
    expect(billCards(1, 10, storage)).toEqual([card(5, 10, 1001)])
    expect(billCards(1, null, storage)).toEqual([])
  })

  it('drops unexpected stored values and extra fields', () => {
    items.set('siot:chat-bills', 'not json')
    expect(billCards(1, null, storage)).toEqual([])

    items.set(
      'siot:chat-bills',
      JSON.stringify({
        memberId: 1,
        cards: [
          null,
          { translationId: '5', conversationId: null, afterMessageId: null },
          { translationId: 6, conversationId: 0, afterMessageId: null },
          { ...card(7, null), amount: 1000 },
        ],
      }),
    )
    expect(billCards(1, null, storage)).toEqual([card(7, null)])
  })

  it('keeps accounts apart', () => {
    addBillCard(1, card(5, 10), storage)
    expect(billCards(2, 10, storage)).toEqual([])

    // The next account's first card replaces the previous account's list.
    addBillCard(2, card(8, 10), storage)
    expect(billCards(2, 10, storage)).toEqual([card(8, 10)])
    expect(billCards(1, 10, storage)).toEqual([])
  })

  it('forgets all cards on logout or account change', () => {
    addBillCard(1, card(5, 10), storage)
    forgetBillCards(undefined, storage)
    expect(items.size).toBe(0)
  })

  it('forgets all cards when the session expires', async () => {
    vi.stubGlobal('sessionStorage', storage)
    addBillCard(1, card(5, 10))

    await queryClient
      .fetchQuery({
        queryKey: ['expired'],
        queryFn: () =>
          Promise.reject(
            new ApiError(401, { code: 'UNAUTHORIZED', message: 'expired' }),
          ),
      })
      .catch(() => undefined)

    expect(billCards(1, 10)).toEqual([])
    queryClient.clear()
  })

  it('forgets the cards of a deleted conversation only', () => {
    addBillCard(1, card(5, 10), storage)
    addBillCard(1, card(6, 11), storage)
    forgetBillCards(10, storage)
    expect(billCards(1, 10, storage)).toEqual([])
    expect(billCards(1, 11, storage)).toEqual([card(6, 11)])
  })

  it('links new chat cards to the conversation the first question creates', () => {
    addBillCard(1, card(5, 10, 1001), storage)
    addBillCard(1, card(6, null), storage)

    linkNewBillCards(2, 12, storage)
    expect(billCards(1, null, storage)).toEqual([card(6, null)])

    linkNewBillCards(1, 12, storage)
    expect(billCards(1, null, storage)).toEqual([])
    expect(billCards(1, 12, storage)).toEqual([card(6, 12)])
    expect(billCards(1, 10, storage)).toEqual([card(5, 10, 1001)])
  })

  it('leaves the new chat cards behind on a new chat', () => {
    addBillCard(1, card(5, 10), storage)
    addBillCard(1, card(6, null), storage)
    dropNewBillCards(1, storage)
    expect(billCards(1, null, storage)).toEqual([])
    expect(billCards(1, 10, storage)).toEqual([card(5, 10)])
  })

  it('keeps the latest 20 cards', () => {
    for (let id = 1; id <= 21; id++) addBillCard(1, card(id, 10), storage)
    expect(billCards(1, 10, storage).map((item) => item.translationId)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 2),
    )
  })

  it('places each card after its message and keeps unknown places last', () => {
    const before = card(1, 10)
    const middle = card(2, 10, 100)
    const second = card(3, 10, 100)
    const gone = card(4, 10, 999)

    const placed = placeBillCards([before, middle, second, gone], [100, 101])
    expect(placed.first).toEqual([before])
    expect(placed.after.get(100)).toEqual([middle, second])
    expect(placed.after.get(101)).toEqual([gone])
    expect(placeBillCards([gone], []).first).toEqual([gone])
  })
})
