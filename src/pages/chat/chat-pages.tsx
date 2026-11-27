import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useChangeLanguage, useMe } from '@/features/auth/use-session'
import { questionMaxLength } from '@/features/chat/api'
import {
  chatTopicPath,
  currentConversation,
  forgetConversation,
  readChatDraft,
  readChatTopic,
  rememberConversation,
} from '@/features/chat/chat-entry'
import { useSuggestions } from '@/features/chat/use-chat'
import { useChatConversation } from '@/features/chat/use-chat-conversation'
import { ChatComposer } from '@/features/chat/ui/chat-composer'
import {
  ChatBubble,
  ChatIntro,
  ChatThinking,
  ChatLayout,
  ChatMessage,
} from '@/features/chat/ui/chat-message'
import { ConversationList } from '@/features/chat/ui/conversation-list'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { LanguageSelect } from '@/shared/ui/language-select'
import { QueryState } from '@/shared/ui/query-state'
import { HistoryIcon, PlusIcon } from '@/shared/ui/icons'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'

/**
 * M08 at `/chat` (new) and `/chat/:conversationId`. One route with an
 * optional segment keeps the page (and input focus) mounted when the first
 * question creates the conversation and the URL changes.
 *
 * CB-03: a plain `/chat` (the chat tab) reopens this visit's current
 * conversation. A question from a detail screen (CB-06) starts a new one.
 */
export function ChatPage() {
  const param = useParams().conversationId
  const { state } = useLocation()
  const { data: me } = useMe()
  const resumeId =
    param === undefined && readChatTopic(state) === undefined && me
      ? currentConversation(me.id)
      : undefined
  if (resumeId !== undefined)
    return <Navigate replace to={`/chat/${resumeId}`} />
  return <ChatScreen />
}

function ChatScreen() {
  const { t } = useTranslation()
  const param = useParams().conversationId
  const id = param === undefined ? undefined : Number(param)
  const invalidId = id !== undefined && !(Number.isSafeInteger(id) && id > 0)
  const { key, state } = useLocation()
  const memberId = useMe().data?.id
  const topic = readChatTopic(state)
  const topicDraft = readChatDraft(state, questionMaxLength)
  const entry =
    id === undefined && topic && topicDraft !== undefined
      ? { key, topic, draft: topicDraft }
      : undefined
  const chat = useChatConversation(invalidId ? undefined : id, entry)
  const changeLanguage = useChangeLanguage()
  const suggestions = useSuggestions(currentLanguage())
  const endRef = useRef<HTMLDivElement>(null)
  const empty = chat.list.length === 0 && chat.sending === undefined
  const notFound = invalidId || chat.notFound

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [chat.list.length, chat.sending])

  // The conversation on screen becomes the one the chat tab reopens.
  const opened = id !== undefined && !invalidId && chat.messages.isSuccess
  useEffect(() => {
    if (opened && memberId !== undefined) rememberConversation(memberId, id)
  }, [opened, memberId, id])
  useEffect(() => {
    if (chat.notFound && id !== undefined) forgetConversation(id)
  }, [chat.notFound, id])

  return (
    <ChatLayout
      header={
        <ScreenHeader
          back={{
            label: t('chat.back'),
            to: chatTopicPath(topic),
          }}
          title={t('nav.chat')}
          actions={
            <>
              <HeaderAction to="/chat/history">
                <HistoryIcon />
                <span className="visually-hidden">{t('chat.history')}</span>
              </HeaderAction>
              <HeaderAction to="/chat" onClick={chat.startOver}>
                <PlusIcon />
                <span className="visually-hidden">{t('chat.newChat')}</span>
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
          <ChatIntro
            language={
              <LanguageSelect
                label={t('chat.answerLanguage')}
                value={currentLanguage()}
                onChange={changeLanguage}
              />
            }
            suggestions={suggestions.data?.questions}
            busy={chat.ask.isPending}
            onAsk={empty && !notFound ? chat.send : undefined}
          />
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
              <ChatThinking />
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
          back={{ label: t('nav.chat'), to: '/chat' }}
          title={t('chat.historyTitle')}
          actions={
            <HeaderAction to="/chat" onClick={() => forgetConversation()}>
              {t('chat.newChat')}
            </HeaderAction>
          }
        />
      }
    >
      <ConversationList />
    </ChatLayout>
  )
}
