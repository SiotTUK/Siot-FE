import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { formatTime } from '@/shared/i18n/format'
import { CameraIcon } from '@/shared/ui/icons'
import type { MessageResponse } from '../api'
import { relatedPagePath } from '../related-pages'
import { groupChatSources, type ChatSource } from './chat-sources'
import styles from './chat.module.css'
import { ToroAvatar } from './toro-picture'

/** Phone link that keeps digits only, e.g. "031-310-3009" → tel:0313103009. */
const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, '')}`

/**
 * One chat entry (Figma v2). `mine`: the question as a full-width light
 * card (M08b). `answer`: the answer card headed "토로 · 웰컴시흥 도우미"
 * (M08b).
 */
export function ChatBubble({
  mine,
  pending,
  answer,
  tone,
  note,
  children,
}: {
  mine?: boolean
  pending?: boolean
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
      <div
        className={`${styles.bubble} ${answer ? styles.answer : ''} ${tone ? styles[tone] : ''}`}
      >
        {answer && (
          <p className={styles.speaker}>
            <ToroAvatar size={28} />
            {t('common.mascots.toro')} · {t('chat.title')}
          </p>
        )}
        {children}
      </div>
      {note && <p className={styles.note}>{note}</p>}
    </div>
  )
}

/**
 * M08a intro: 토로, what the helper does and the answer language; then the
 * time, and 토로's greeting bubbles with the suggested questions under one
 * profile picture.
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
  const { t, i18n } = useTranslation()
  const [openedAt] = useState(() => new Date())
  return (
    <>
      <div className={styles.intro}>
        <ToroAvatar size={72} />
        <strong>
          {t('common.mascots.toro')} · {t('chat.title')}
        </strong>
        <p>{t('chat.intro')}</p>
        {language}
      </div>
      {onAsk && (
        <>
          <p className={styles.time}>
            {t('chat.today', { time: formatTime(openedAt, i18n.language) })}
          </p>
          <div className={styles.toro}>
            <ToroAvatar size={32} />
            <div className={styles.toroMessages}>
              <p className={styles.toroBubble}>{t('chat.greetingHello')}</p>
              <p className={styles.toroBubble}>{t('chat.greetingAsk')}</p>
              <ul
                className={styles.suggestions}
                aria-label={t('chat.suggestions')}
              >
                <li>
                  <button
                    type="button"
                    disabled={photoDisabled}
                    onClick={onPhoto}
                  >
                    <CameraIcon aria-hidden="true" />
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
            </div>
          </div>
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
  onFeedback: (helpful: boolean) => void
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
        <div className={styles.feedback}>
          <p>{t('chat.helpfulQuestion')}</p>
          {[false, true].map((helpful) => (
            <button
              key={String(helpful)}
              type="button"
              aria-pressed={message.helpful === helpful}
              disabled={feedbackDisabled}
              onClick={() => onFeedback(helpful)}
            >
              {t(helpful ? 'chat.helpful' : 'chat.notHelpful')}
            </button>
          ))}
        </div>
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
