import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { useChangeLanguage } from '@/features/auth/use-session'
import { questionMaxLength } from '@/features/chat/api'
import { isEventId } from '@/features/events/event-routes'
import { useSuggestions } from '@/features/chat/use-chat'
import { useChatConversation } from '@/features/chat/use-chat-conversation'
import { ChatComposer } from '@/features/chat/ui/chat-composer'
import {
  ChatBubble,
  ChatLayout,
  ChatMessage,
} from '@/features/chat/ui/chat-message'
import { ConversationList } from '@/features/chat/ui/conversation-list'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { LanguageSelect } from '@/shared/ui/language-select'
import { QueryState } from '@/shared/ui/query-state'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'

/**
 * M08 at `/chat` (new) and `/chat/:conversationId`. One route with an
 * optional segment keeps the page (and input focus) mounted when the first
 * question creates the conversation and the URL changes.
 */
export function ChatPage() {
  const { t } = useTranslation()
  const param = useParams().conversationId
  const id = param === undefined ? undefined : Number(param)
  const invalidId = id !== undefined && !(Number.isSafeInteger(id) && id > 0)
  const { key, state } = useLocation()
  const eventId = isEventId(state?.eventQuestionId)
    ? state.eventQuestionId
    : undefined
  const eventQuestion =
    id === undefined && eventId && typeof state?.eventQuestionDraft === 'string'
      ? {
          key,
          eventId,
          draft: state.eventQuestionDraft.slice(0, questionMaxLength),
        }
      : undefined
  const chat = useChatConversation(invalidId ? undefined : id, eventQuestion)
  const changeLanguage = useChangeLanguage()
  const suggestions = useSuggestions(currentLanguage())
  const endRef = useRef<HTMLDivElement>(null)
  const empty = chat.list.length === 0 && chat.sending === undefined
  const notFound = invalidId || chat.notFound

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [chat.list.length, chat.sending])

  return (
    <ChatLayout
      header={
        <ScreenHeader
          back={{
            label: t('chat.back'),
            to: eventId ? `/events/${eventId}` : '/home',
          }}
          title={t('chat.title')}
          actions={
            <>
              <LanguageSelect
                label={t('common.language')}
                value={currentLanguage()}
                onChange={changeLanguage}
              />
              <HeaderAction to="/chat/history">
                {t('chat.history')}
              </HeaderAction>
              <HeaderAction to="/chat" onClick={chat.startOver}>
                {t('chat.newChat')}
              </HeaderAction>
            </>
          }
        />
      }
      footer={
        <ChatComposer
          draft={chat.draft}
          onDraftChange={chat.setDraft}
          onSend={chat.send}
          suggestions={empty ? suggestions.data?.questions : undefined}
          busy={chat.ask.isPending}
          disabled={notFound}
          error={
            chat.ask.isError || chat.feedback.isError
              ? errorMessage(t, chat.ask.error ?? chat.feedback.error)
              : undefined
          }
        />
      }
    >
      {notFound ? (
        <ChatBubble tone="caution">{t('chat.notFound')}</ChatBubble>
      ) : (
        <QueryState
          query={
            id === undefined
              ? { ...chat.messages, isPending: false }
              : chat.messages
          }
        >
          {empty && <ChatBubble>{t('chat.greeting')}</ChatBubble>}
          {chat.list.map((message, index) => {
            // Only the latest failed answer offers to send its question again.
            const question = chat.list[index - 1]
            const retryable =
              index === chat.list.length - 1 &&
              message.answerStatus === 'ERROR' &&
              question?.role === 'USER' &&
              chat.sending === undefined
            return (
              <ChatMessage
                key={message.messageId}
                message={message}
                conversationPath={id === undefined ? undefined : `/chat/${id}`}
                feedbackDisabled={chat.feedback.isPending}
                onFeedback={(helpful) => chat.rate(message.messageId, helpful)}
                onRetry={
                  retryable ? () => chat.send(question.content) : undefined
                }
              />
            )
          })}
          {chat.sending !== undefined && (
            <>
              <ChatBubble mine pending>
                {chat.sending}
              </ChatBubble>
              <ChatBubble pending>{t('chat.thinking')} · · ·</ChatBubble>
            </>
          )}
        </QueryState>
      )}
      <div ref={endRef} />
    </ChatLayout>
  )
}

/** CB-03 past conversations. */
export function ChatHistoryPage() {
  const { t } = useTranslation()
  return (
    <ChatLayout
      header={
        <ScreenHeader
          back={{ label: t('chat.title'), to: '/chat' }}
          title={t('chat.historyTitle')}
          actions={<HeaderAction to="/chat">{t('chat.newChat')}</HeaderAction>}
        />
      }
    >
      <ConversationList />
    </ChatLayout>
  )
}
