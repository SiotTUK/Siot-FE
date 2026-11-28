import { Fragment, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Navigate,
  useLocation,
  useNavigationType,
  useParams,
} from 'react-router-dom'
import { useChangeLanguage, useMe } from '@/features/auth/use-session'
import { photoTypes } from '@/features/bill-translation/bill-translation'
import { BillConsentSheet } from '@/features/bill-translation/ui/bill-consent'
import { BillFileInput } from '@/features/bill-translation/ui/bill-file-input'
import { questionMaxLength } from '@/features/chat/api'
import {
  dropNewBillCards,
  forgetBillCards,
  linkNewBillCards,
  placeBillCards,
  type ChatBillCard,
} from '@/features/chat/chat-bill-cards'
import {
  chatTopicPath,
  currentConversation,
  forgetConversation,
  readChatDraft,
  readChatTopic,
  rememberConversation,
} from '@/features/chat/chat-entry'
import { useSuggestions } from '@/features/chat/use-chat'
import { useChatBill } from '@/features/chat/use-chat-bill'
import { useChatConversation } from '@/features/chat/use-chat-conversation'
import {
  ChatBillPendingTurn,
  ChatBillResultTurn,
} from '@/features/chat/ui/chat-bill'
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
  const { t, i18n } = useTranslation()
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
  const navigationType = useNavigationType()
  const bill = useChatBill(
    memberId ?? 0,
    id ?? null,
    entry !== undefined && navigationType === 'PUSH',
  )
  const chat = useChatConversation(
    invalidId ? undefined : id,
    entry,
    (created) => {
      if (memberId !== undefined) linkNewBillCards(memberId, created)
    },
  )
  const changeLanguage = useChangeLanguage()
  const suggestions = useSuggestions(currentLanguage())
  const endRef = useRef<HTMLDivElement>(null)
  const scrollToEnd = useCallback(
    () => endRef.current?.scrollIntoView({ block: 'end' }),
    [],
  )
  const empty = chat.list.length === 0 && chat.sending === undefined
  const notFound = invalidId || chat.notFound
  const photoInput = useRef<HTMLInputElement>(null)
  // A card's place is the last message, so it must be loaded and settled.
  const photoDisabled =
    notFound ||
    chat.ask.isPending ||
    bill.processing ||
    (id !== undefined && !chat.messages.isSuccess)
  const pickPhoto = () => photoInput.current?.click()
  /** No question is sent while a photo is processed, so the log keeps order. */
  const send = (text: string) => {
    if (bill.processing || !text.trim()) return
    bill.dismiss()
    chat.send(text)
  }
  const billPlaces = placeBillCards(
    bill.cards,
    chat.list.map((message) => message.messageId),
  )
  const billResults = (cards: ChatBillCard[] = []) =>
    cards.map((card) => (
      <ChatBillResultTurn
        key={card.translationId}
        memberId={memberId ?? 0}
        translationId={card.translationId}
        conversationPath={id === undefined ? '/chat' : `/chat/${id}`}
        onLoaded={scrollToEnd}
      />
    ))

  useEffect(() => {
    scrollToEnd()
  }, [
    scrollToEnd,
    chat.list.length,
    chat.sending,
    bill.cards.length,
    bill.turn?.step,
  ])

  // The conversation on screen becomes the one the chat tab reopens.
  const opened = id !== undefined && !invalidId && chat.messages.isSuccess
  useEffect(() => {
    if (opened && memberId !== undefined) rememberConversation(memberId, id)
  }, [opened, memberId, id])
  useEffect(() => {
    if (!chat.notFound || id === undefined) return
    forgetConversation(id)
    forgetBillCards(id)
  }, [chat.notFound, id])

  return (
    <ChatLayout
      header={
        <ScreenHeader
          back={{
            label: t('chat.back'),
            to: chatTopicPath(topic),
          }}
          title={t('chat.title')}
          actions={
            <>
              <HeaderAction to="/chat/history">
                <HistoryIcon />
                <span className="visually-hidden">{t('chat.history')}</span>
              </HeaderAction>
              <HeaderAction
                to="/chat"
                onClick={() => {
                  chat.startOver()
                  bill.startOver()
                }}
              >
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
          onSend={send}
          busy={chat.ask.isPending || bill.processing}
          disabled={notFound}
          onPhoto={pickPhoto}
          photoDisabled={photoDisabled}
          error={
            bill.fileError
              ? t(
                  bill.fileError === 'BILL_FILE_TOO_LARGE'
                    ? 'bill.errors.BILL_FILE_TOO_LARGE'
                    : 'chat.bill.photoOnly',
                )
              : chat.ask.isError || chat.feedback.isError
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
                variant="pill"
                label={t('chat.answerLanguage')}
                value={currentLanguage()}
                onChange={changeLanguage}
                optionLabel={(code) => i18n.getFixedT(code)('chat.answerIn')}
              />
            }
            suggestions={suggestions.data?.questions}
            busy={chat.ask.isPending || bill.processing}
            onAsk={empty && !notFound ? send : undefined}
            onPhoto={pickPhoto}
            photoDisabled={photoDisabled}
          />
          {billResults(billPlaces.first)}
          {chat.list.map((message, index) => {
            // Only the latest failed answer offers to send its question again.
            const question = chat.list[index - 1]
            const retryable =
              index === chat.list.length - 1 &&
              message.answerStatus === 'ERROR' &&
              question?.role === 'USER' &&
              chat.sending === undefined
            return (
              <Fragment key={message.messageId}>
                <ChatMessage
                  message={message}
                  conversationPath={
                    id === undefined ? undefined : `/chat/${id}`
                  }
                  feedbackDisabled={chat.feedback.isPending}
                  onFeedback={(helpful) =>
                    chat.rate(message.messageId, helpful)
                  }
                  onRetry={retryable ? () => send(question.content) : undefined}
                />
                {billResults(billPlaces.after.get(message.messageId))}
              </Fragment>
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
          {bill.turn && (
            <ChatBillPendingTurn
              turn={bill.turn}
              onCancel={bill.clear}
              onResend={bill.select}
              onPickAgain={pickPhoto}
            />
          )}
        </QueryState>
      )}
      <div ref={endRef} />
      <BillFileInput
        ref={photoInput}
        accept={photoTypes}
        onSelect={bill.select}
        onReject={bill.reject}
      />
      {bill.file && (
        <BillConsentSheet
          consent={bill.consent}
          onConsentChange={bill.setConsent}
          onAgree={() => void bill.start(chat.list.at(-1)?.messageId ?? null)}
          onClose={bill.closeConsent}
        />
      )}
    </ChatLayout>
  )
}

/** CB-03 past conversations. */
export function ChatHistoryPage() {
  const { t } = useTranslation()
  const memberId = useMe().data?.id
  return (
    <ChatLayout
      header={
        <ScreenHeader
          back={{ label: t('nav.chat'), to: '/chat' }}
          title={t('chat.historyTitle')}
          actions={
            <HeaderAction
              to="/chat"
              onClick={() => {
                forgetConversation()
                if (memberId !== undefined) dropNewBillCards(memberId)
              }}
            >
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
