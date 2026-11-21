import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { MessageResponse, SourceResponse } from '../api'
import styles from './chat.module.css'

/** Phone link that keeps digits only, e.g. "031-310-3009" → tel:0313103009. */
const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, '')}`

/** One speech bubble; `mine` puts it on the right in the brand color. */
export function ChatBubble({
  mine,
  pending,
  tone,
  note,
  children,
}: {
  mine?: boolean
  pending?: boolean
  tone?: 'caution' | 'emergency'
  note?: string
  children: ReactNode
}) {
  return (
    <div
      className={`${styles.row} ${mine ? styles.mine : ''} ${pending ? styles.pending : ''}`}
      role={pending ? 'status' : undefined}
    >
      <div className={`${styles.bubble} ${tone ? styles[tone] : ''}`}>
        {children}
      </div>
      {note && <p className={styles.note}>{note}</p>}
    </div>
  )
}

function SourceChip({ source }: { source: SourceResponse }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { pageStart, pageEnd, sourceUrl } = source
  const pages =
    pageStart === null
      ? undefined
      : pageEnd !== null && pageEnd !== pageStart
        ? t('chat.pages', { start: pageStart, end: pageEnd })
        : t('chat.page', { start: pageStart })
  const hasDetail = Boolean(pages || sourceUrl)
  return (
    <li>
      <button
        type="button"
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
          {pages}
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
 * One question or answer (M08b·M08c). Server text is plain text, never HTML.
 */
export function ChatMessage({
  message,
  onFeedback,
  feedbackDisabled,
  onRetry,
}: {
  message: MessageResponse
  onFeedback: (helpful: boolean) => void
  feedbackDisabled?: boolean
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
      {message.content}
      {referral && (
        <>
          {'\n'}
          {referral.notice}
          {referral.contacts.map((contact) => (
            <span key={`${contact.topic}-${contact.number}`}>
              {'\n'}
              <a {...call(contact)}>☎{contact.number}</a> {contact.label}
            </span>
          ))}
        </>
      )}
      {relatedPages.length > 0 && (
        // CB-10·CB-02: related checklist / rule / event items. Their detail
        // screens are not built yet, so only the titles are shown for now.
        <div className={styles.related}>
          <span>{t('chat.related')}</span>
          <ul>
            {relatedPages.map((page) => (
              <li key={`${page.type}-${page.code}`}>{page.title}</li>
            ))}
          </ul>
        </div>
      )}
      {sources.length > 0 && (
        <ul className={styles.chips}>
          {[...sources]
            .sort((a, b) => a.order - b.order)
            .map((source) => (
              <SourceChip key={source.order} source={source} />
            ))}
        </ul>
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
          {t('chat.helpfulQuestion')}
          {[true, false].map((helpful) => (
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
