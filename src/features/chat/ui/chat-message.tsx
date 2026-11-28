import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'
import toro from '@/shared/assets/mascot/toro.png'
import { feedbackCommentMaxLength, type MessageResponse } from '../api'
import { relatedPagePath } from '../related-pages'
import { groupChatSources, type ChatSource } from './chat-sources'
import styles from './chat.module.css'

/** Phone link that keeps digits only, e.g. "031-310-3009" → tel:0313103009. */
const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, '')}`

/**
 * One chat entry (Figma v2). `mine`: the question as a full-width light
 * card (M08b). `avatar`: a 토로 greeting bubble (M08a). `answer`: the
 * answer card headed "토로 · 챗봇" (M08b).
 */
export function ChatBubble({
  mine,
  pending,
  avatar,
  answer,
  tone,
  note,
  children,
}: {
  mine?: boolean
  pending?: boolean
  avatar?: boolean
  answer?: boolean
  tone?: 'caution' | 'emergency'
  note?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div
      className={`${styles.row} ${mine ? styles.mine : ''} ${pending ? styles.pending : ''}`}
      role={pending ? 'status' : undefined}
    >
      {avatar ? (
        <div className={styles.withAvatar}>
          <img src={toro} alt="" width={28} height={28} />
          <div className={styles.bubble}>{children}</div>
        </div>
      ) : (
        <div
          className={`${styles.bubble} ${answer ? styles.answer : ''} ${tone ? styles[tone] : ''}`}
        >
          {answer && (
            <p className={styles.speaker}>
              <img src={toro} alt="" width={24} height={24} />
              {t('common.mascots.toro')} · {t('nav.chat')}
            </p>
          )}
          {children}
        </div>
      )}
      {note && <p className={styles.note}>{note}</p>}
    </div>
  )
}

/**
 * M08a intro: 토로, what the helper does, and the answer language, then the
 * greeting and suggested questions as outlined chips.
 */
export function ChatIntro({
  language,
  suggestions = [],
  busy,
  onAsk,
  onPhoto,
  photoDisabled,
}: {
  language: ReactNode
  suggestions?: string[]
  busy: boolean
  onAsk?: (question: string) => void
  /** #29: the first chip opens the photo picker instead of asking. */
  onPhoto: () => void
  photoDisabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <>
      <div className={styles.intro}>
        <img src={toro} alt="" width={72} height={72} />
        <strong>
          {t('common.mascots.toro')} · {t('nav.chat')}
        </strong>
        <p>{t('chat.intro')}</p>
        {language}
      </div>
      {onAsk && (
        <>
          <ChatBubble avatar>{t('chat.greetingHello')}</ChatBubble>
          <ChatBubble avatar>{t('chat.greetingAsk')}</ChatBubble>
          <ul className={styles.suggestions} aria-label={t('chat.suggestions')}>
            <li>
              <button type="button" disabled={photoDisabled} onClick={onPhoto}>
                <span aria-hidden="true">📷 </span>
                {t('chat.bill.chip')}
              </button>
            </li>
            {suggestions.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAsk(question)}
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function SourceChip({ source }: { source: ChatSource }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { pages, sourceUrl } = source
  const hasDetail = pages.length > 0 || Boolean(sourceUrl)
  return (
    <li>
      <button
        type="button"
        className={styles.sourceLink}
        aria-expanded={hasDetail ? open : undefined}
        disabled={!hasDetail}
        onClick={() => setOpen((value) => !value)}
      >
        {t('chat.source', {
          name: source.documentName ?? t('chat.deletedSource'),
        })}
      </button>
      {open && (
        <span className={styles.sourceDetail}>
          {pages.length > 0 && (
            <span>
              {pages
                .map((page) =>
                  typeof page === 'number'
                    ? t('chat.page', { start: page })
                    : t('chat.pages', page),
                )
                .join(', ')}
            </span>
          )}
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {t('chat.openSource')}
            </a>
          )}
        </span>
      )}
    </li>
  )
}

/** CB-04: `onSent` runs once the rating (and comment) is saved. */
type OnFeedback = (
  input: { helpful: boolean; comment?: string },
  onSent?: () => void,
) => void

/**
 * CB-04 "도움이 됐나요?". "안 됐어요" saves the rating right away and opens an
 * optional comment box; closing it without sending keeps the rating. The
 * messages API does not return the comment, so a reopened answer starts with
 * the box closed and empty.
 */
function FeedbackControls({
  messageId,
  helpful,
  disabled,
  onFeedback,
}: {
  messageId: number
  helpful: boolean | null
  disabled?: boolean
  onFeedback: OnFeedback
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const notHelpfulRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const inputId = `feedback-comment-${messageId}`

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const rate = (value: boolean) => {
    onFeedback({ helpful: value })
    setSent(false)
    setOpen(!value)
    if (value) setComment('')
  }
  const close = () => {
    setOpen(false)
    notHelpfulRef.current?.focus()
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!comment.trim()) return close()
    onFeedback({ helpful: false, comment }, () => {
      setOpen(false)
      setComment('')
      setSent(true)
      notHelpfulRef.current?.focus()
    })
  }

  return (
    <>
      <div className={styles.feedback}>
        <p>{t('chat.helpfulQuestion')}</p>
        {[false, true].map((value) => (
          <button
            key={String(value)}
            ref={value ? undefined : notHelpfulRef}
            type="button"
            aria-pressed={helpful === value}
            aria-expanded={value ? undefined : open}
            aria-controls={value || !open ? undefined : inputId}
            disabled={disabled}
            onClick={() => rate(value)}
          >
            {t(value ? 'chat.helpful' : 'chat.notHelpful')}
          </button>
        ))}
      </div>
      {open && (
        <form
          className={styles.comment}
          onSubmit={submit}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
          }}
        >
          <label htmlFor={inputId}>{t('chat.commentLabel')}</label>
          <p id={`${inputId}-hint`} className={styles.privacy}>
            {t('chat.privacy')}
          </p>
          <textarea
            ref={inputRef}
            id={inputId}
            rows={3}
            value={comment}
            maxLength={feedbackCommentMaxLength}
            placeholder={t('chat.commentPlaceholder')}
            aria-describedby={`${inputId}-hint ${inputId}-count`}
            onChange={(event) => setComment(event.target.value)}
          />
          <p id={`${inputId}-count`} className={styles.commentCount}>
            {t('chat.commentCount', {
              length: comment.length,
              max: feedbackCommentMaxLength,
            })}
          </p>
          <div className={styles.commentActions}>
            <button type="button" onClick={close}>
              {t('chat.commentClose')}
            </button>
            <button type="submit" disabled={disabled || !comment.trim()}>
              {t('chat.commentSend')}
            </button>
          </div>
        </form>
      )}
      {sent && (
        <p className={styles.commentSent} role="status">
          {t('chat.commentSent')}
        </p>
      )}
    </>
  )
}

/**
 * One question or answer (M08b·M08c).
 */
export function ChatMessage({
  message,
  onFeedback,
  feedbackDisabled,
  onRetry,
  conversationPath,
}: {
  message: MessageResponse
  onFeedback: OnFeedback
  feedbackDisabled?: boolean
  conversationPath?: string
  /** CB-02·COM-04: offered on a failed (ERROR) answer to send the question again. */
  onRetry?: () => void
}) {
  const { t } = useTranslation()
  if (message.role === 'USER')
    return (
      <ChatBubble mine note={message.masked ? t('chat.masked') : undefined}>
        {message.content}
      </ChatBubble>
    )

  const { emergencyContacts, referral, sources, relatedPages, answerStatus } =
    message
  const call = (contact: { label: string; number: string }) => ({
    href: telHref(contact.number),
    'aria-label': t('chat.call', {
      label: contact.label,
      number: contact.number,
    }),
  })
  return (
    <ChatBubble
      answer
      tone={
        emergencyContacts.length > 0
          ? 'emergency'
          : answerStatus !== 'ANSWERED' || referral
            ? 'caution'
            : undefined
      }
    >
      {emergencyContacts.length > 0 && (
        <div className={styles.calls} aria-label={t('chat.emergency')}>
          {emergencyContacts.map((contact) => (
            <a key={contact.number} {...call(contact)}>
              ☎ {contact.number} {contact.label}
            </a>
          ))}
        </div>
      )}
      {answerStatus === 'ANSWERED' ? (
        <div className={styles.markdown}>
          <Markdown skipHtml disallowedElements={['img']}>
            {message.content}
          </Markdown>
        </div>
      ) : (
        message.content
      )}
      {referral && (
        <div className={styles.referral}>
          {referral.notice}
          {referral.contacts.map((contact) => (
            <span key={`${contact.topic}-${contact.number}`}>
              {'\n'}
              <a {...call(contact)}>☎{contact.number}</a> {contact.label}
            </span>
          ))}
        </div>
      )}
      {sources.length > 0 && (
        <ul className={styles.sources}>
          {groupChatSources(sources).map((source) => (
            <SourceChip key={source.order} source={source} />
          ))}
        </ul>
      )}
      {relatedPages.length > 0 && (
        <div className={styles.related}>
          <span className="visually-hidden">{t('chat.related')}</span>
          <ul>
            {relatedPages.map((page) => {
              const path = relatedPagePath(page)
              return (
                <li key={`${page.type}-${page.code}`}>
                  {path ? (
                    <Link to={path} state={{ from: conversationPath }}>
                      {t('chat.relatedOpen', { title: page.title })}
                    </Link>
                  ) : (
                    <span>{page.title}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {answerStatus === 'ERROR' && onRetry && (
        <div className={styles.feedback}>
          <button type="button" onClick={onRetry}>
            {t('chat.retryAnswer')}
          </button>
        </div>
      )}
      {answerStatus !== 'ERROR' && (
        <FeedbackControls
          messageId={message.messageId}
          helpful={message.helpful}
          disabled={feedbackDisabled}
          onFeedback={onFeedback}
        />
      )}
    </ChatBubble>
  )
}

/** "답변을 찾고 있어요 · · ·" while an answer is on its way (M08b). */
export function ChatThinking() {
  const { t } = useTranslation()
  return (
    <p className={styles.thinking} role="status">
      {t('chat.thinking')} · · ·
    </p>
  )
}

/** Header, scrolling log and composer of the chat screens. */
export function ChatLayout({
  header,
  footer,
  children,
}: {
  header: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={styles.screen}>
      {header}
      <main className={styles.log} aria-live="polite">
        {children}
      </main>
      {footer}
    </div>
  )
}
