import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { questionMaxLength } from '@/features/chat/api'
import {
  useAsk,
  useFeedback,
  useMessages,
  useSuggestions,
} from '@/features/chat/use-chat'
import { ChatMessage, ChatThinking } from '@/features/chat/ui/chat-message'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageLoader } from '@/shared/ui/mobile-frame'
import { FormError } from '@/shared/ui/page'
import { ChatHeader } from './chat-header'
import styles from './chat.module.css'

function parseId(value: string | undefined): number | undefined | null {
  if (value === undefined) return undefined
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * M08 chatbot at `/chat` (new) and `/chat/:conversationId`.
 * One route with an optional segment: the page (and the input's focus) stays
 * mounted when the first question creates the conversation and the URL changes.
 */
export function ChatPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const conversationId = parseId(params.conversationId)
  const language = currentLanguage()

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState<string>()
  const [createdId, setCreatedId] = useState<number>()
  const endRef = useRef<HTMLDivElement>(null)

  const activeId = conversationId ?? createdId
  const messages = useMessages(conversationId ?? undefined)
  const suggestions = useSuggestions(language)
  const feedback = useFeedback(activeId ?? 0)
  const ask = useAsk(setCreatedId)

  const list = messages.data ?? []
  const empty = list.length === 0 && sending === undefined

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [list.length, sending])

  const submit = (text: string) => {
    const content = text.trim()
    if (!content || ask.isPending || conversationId === null) return
    setSending(content)
    setDraft('')
    ask.mutate(
      { conversationId: activeId, content, language },
      {
        onSuccess: ({ conversationId: id }) => {
          if (conversationId === undefined) {
            navigate(`/chat/${id}`, { replace: true })
            // The URL carries the id now; a later "/chat" must start fresh.
            setCreatedId(undefined)
          }
        },
        // Give back the failed question unless they already typed a new one.
        // Nothing is retried automatically.
        onError: () => setDraft((current) => current || content),
        onSettled: () => setSending(undefined),
      },
    )
  }

  const startOver = () => {
    setCreatedId(undefined)
    setDraft('')
    ask.reset()
    feedback.reset()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line; ignore Enter that ends IME input.
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit(draft)
    }
  }

  const notFound =
    conversationId === null ||
    (messages.error instanceof ApiError &&
      messages.error.code === 'CHAT_CONVERSATION_NOT_FOUND')

  return (
    <div className={styles.screen}>
      <ChatHeader
        title={t('chat.title')}
        backTo="/home"
        backLabel={t('chat.back')}
      >
        <Link className={styles.headerLink} to="/chat/history">
          {t('chat.history')}
        </Link>
        <Link className={styles.headerLink} to="/chat" onClick={startOver}>
          {t('chat.newChat')}
        </Link>
      </ChatHeader>

      <main className={styles.log} aria-live="polite">
        {notFound ? (
          <div className={styles.center}>
            <p>{t('chat.notFound')}</p>
            <Link className={styles.headerLink} to="/chat">
              {t('chat.newChat')}
            </Link>
          </div>
        ) : messages.isPending && conversationId !== undefined ? (
          <PageLoader label={t('common.loading')} />
        ) : messages.isError ? (
          <div className={styles.center}>
            <FormError message={errorMessage(t, messages.error)} />
            <Button
              variant="secondary"
              loading={messages.isFetching}
              onClick={() => void messages.refetch()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <>
            {empty && (
              <div className={styles.row}>
                <p className={styles.greeting}>{t('chat.greeting')}</p>
              </div>
            )}
            {list.map((message) => (
              <div key={message.messageId} className={styles.item}>
                <ChatMessage
                  message={message}
                  feedbackDisabled={feedback.isPending}
                  onFeedback={
                    activeId === undefined
                      ? undefined
                      : (helpful) =>
                          feedback.mutate({
                            messageId: message.messageId,
                            helpful,
                          })
                  }
                />
                {message.masked && (
                  <p className={styles.masked}>{t('chat.masked')}</p>
                )}
              </div>
            ))}
            {sending !== undefined && (
              <>
                <div className={`${styles.row} ${styles.mine}`}>
                  <p className={styles.pendingQuestion}>{sending}</p>
                </div>
                <ChatThinking />
              </>
            )}
          </>
        )}
        <div ref={endRef} />
      </main>

      <div className={styles.composer}>
        {empty && !notFound && suggestions.data && (
          <ul className={styles.suggestions} aria-label={t('chat.suggestions')}>
            {suggestions.data.questions.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  className={styles.suggestion}
                  disabled={ask.isPending}
                  onClick={() => submit(question)}
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        )}
        {(ask.isError || feedback.isError) && (
          <FormError message={errorMessage(t, ask.error ?? feedback.error)} />
        )}
        <p className={styles.privacy}>{t('chat.privacy')}</p>
        <form
          className={styles.inputRow}
          onSubmit={(event) => {
            event.preventDefault()
            submit(draft)
          }}
        >
          <label className="visually-hidden" htmlFor="chat-input">
            {t('chat.inputLabel')}
          </label>
          <textarea
            id="chat-input"
            className={styles.input}
            rows={1}
            maxLength={questionMaxLength}
            placeholder={t('chat.placeholder')}
            value={draft}
            disabled={notFound}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="submit"
            className={styles.send}
            disabled={!draft.trim() || ask.isPending || notFound}
          >
            {t('chat.send')}
          </button>
        </form>
      </div>
    </div>
  )
}
