import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import {
  chatEntryState,
  forgetConversation,
  type ChatTopic,
} from './chat-entry'
import { useAsk, useFeedback, useMessages } from './use-chat'

/**
 * State of one chat screen: the open conversation (or a new one), the question
 * on its way, and the draft. The conversation is created with the first
 * question, then the URL switches to it without remounting the page.
 */
export function useChatConversation(
  conversationId: number | undefined,
  /** A question started from a detail screen (CB-06). */
  entry?: { key: string; draft: string; topic: ChatTopic },
) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(entry?.draft ?? '')
  const [draftKey, setDraftKey] = useState(entry?.key)
  if (entry && draftKey !== entry.key) {
    setDraftKey(entry.key)
    setDraft(entry.draft)
  }
  const [sending, setSending] = useState<string>()
  const [createdId, setCreatedId] = useState<number>()
  const activeId = conversationId ?? createdId
  const messages = useMessages(conversationId)
  const feedback = useFeedback(activeId ?? 0)
  const ask = useAsk(setCreatedId)

  const send = (text: string) => {
    const content = text.trim()
    if (!content || ask.isPending) return
    setSending(content)
    setDraft('')
    ask.mutate(
      { conversationId: activeId, content, language: currentLanguage() },
      {
        onSuccess: ({ conversationId: id }) => {
          if (conversationId !== undefined) return
          navigate(`/chat/${id}`, {
            replace: true,
            // Keep the back button pointing at the detail screen.
            state: entry && chatEntryState(entry.topic),
          })
          // The URL carries the id now; a later "/chat" must start fresh.
          setCreatedId(undefined)
        },
        // Give back the failed question unless a new one was typed.
        // Nothing is retried automatically.
        onError: () => setDraft((current) => current || content),
        onSettled: () => setSending(undefined),
      },
    )
  }

  return {
    messages,
    list: messages.data ?? [],
    notFound:
      messages.error instanceof ApiError &&
      messages.error.code === 'CHAT_CONVERSATION_NOT_FOUND',
    draft,
    setDraft,
    sending,
    send,
    ask,
    feedback,
    rate: (messageId: number, helpful: boolean) =>
      activeId !== undefined && feedback.mutate({ messageId, helpful }),
    startOver: () => {
      forgetConversation()
      setCreatedId(undefined)
      setDraft('')
      ask.reset()
      feedback.reset()
    },
  }
}
