import { beforeEach, describe, expect, it } from 'vitest'
import {
  chatEntryState,
  chatTopicPath,
  currentConversation,
  forgetConversation,
  readChatDraft,
  readChatTopic,
  rememberConversation,
} from './chat-entry'

class MemoryStorage implements Storage {
  private items = new Map<string, string>()
  get length() {
    return this.items.size
  }
  clear() {
    this.items.clear()
  }
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
  setItem(key: string, value: string) {
    this.items.set(key, value)
  }
}

describe('readChatTopic', () => {
  it.each([
    [{ type: 'event', id: '42' }, '/events/42'],
    [{ type: 'rule', id: 'waste-food' }, '/rules/waste-food'],
  ] as const)('reads %o and returns to %s', (topic, path) => {
    const state = chatEntryState(topic, 'draft')
    expect(readChatTopic(state)).toEqual(topic)
    expect(chatTopicPath(readChatTopic(state))).toBe(path)
  })

  it.each([
    undefined,
    null,
    'event',
    {},
    { chatTopic: { type: 'event', id: '0' } },
    { chatTopic: { type: 'event', id: '1/../admin' } },
    { chatTopic: { type: 'rule', id: '../me' } },
    { chatTopic: { type: 'rule', id: 'Waste' } },
    { chatTopic: { type: 'checklist', id: '1' } },
    { chatTopic: { type: 'rule', id: 7 } },
  ])('drops %o', (state) => {
    expect(readChatTopic(state)).toBeUndefined()
  })

  it('returns home without a topic', () => {
    expect(chatTopicPath(undefined)).toBe('/home')
  })
})

describe('readChatDraft', () => {
  it('reads and trims the draft to the question limit', () => {
    expect(readChatDraft({ chatDraft: 'abcdef' }, 3)).toBe('abc')
    expect(readChatDraft({ chatDraft: 1 }, 3)).toBeUndefined()
    expect(readChatDraft(chatEntryState({ type: 'rule', id: 'a' }), 3)).toBe(
      undefined,
    )
  })
})

describe('current conversation', () => {
  let storage: MemoryStorage
  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('reopens the conversation only for the same member', () => {
    rememberConversation(1, 10, storage)
    expect(currentConversation(1, storage)).toBe(10)
    expect(currentConversation(2, storage)).toBeUndefined()
  })

  it('forgets everything, or only the deleted conversation', () => {
    rememberConversation(1, 10, storage)
    forgetConversation(11, storage)
    expect(currentConversation(1, storage)).toBe(10)
    forgetConversation(10, storage)
    expect(currentConversation(1, storage)).toBeUndefined()

    rememberConversation(1, 12, storage)
    forgetConversation(undefined, storage)
    expect(currentConversation(1, storage)).toBeUndefined()
  })

  it('ignores broken stored values', () => {
    storage.setItem('siot:chat-current', '{"memberId":1,"conversationId":0}')
    expect(currentConversation(1, storage)).toBeUndefined()
    storage.setItem('siot:chat-current', 'not json')
    expect(currentConversation(1, storage)).toBeUndefined()
  })
})
