import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MessageResponse, SourceResponse } from '../api'
import styles from './chat-message.module.css'

/** Phone link that keeps digits only, e.g. "031-310-3009" → tel:0313103009. */
function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, '')}`
}

function SourceChip({ source }: { source: SourceResponse }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const name = source.documentName ?? t('chat.deletedSource')
  const pages =
    source.pageStart === null
      ? undefined
      : source.pageEnd !== null && source.pageEnd !== source.pageStart
        ? t('chat.pages', { start: source.pageStart, end: source.pageEnd })
        : t('chat.page', { start: source.pageStart })
  const hasDetail = Boolean(pages || source.sourceUrl)

  return (
    <li className={styles.source}>
      <button
        type="button"
        className={styles.sourceChip}
        aria-expanded={hasDetail ? open : undefined}
        disabled={!hasDetail}
        onClick={() => setOpen((value) => !value)}
      >
        {t('chat.source', { name })}
      </button>
      {open && (
        <span className={styles.sourceDetail}>
          {pages}
          {source.sourceUrl && (
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
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
 * Server text is rendered as plain text, never as HTML.
 */
export function ChatMessage({
  message,
  onFeedback,
  feedbackDisabled,
}: {
  message: MessageResponse
  onFeedback?: (helpful: boolean) => void
  feedbackDisabled?: boolean
}) {
  const { t } = useTranslation()

  if (message.role === 'USER')
    return (
      <div className={`${styles.row} ${styles.mine}`}>
        <p className={`${styles.bubble} ${styles.question}`}>
          {message.content}
        </p>
      </div>
    )

  const emergency = message.emergencyContacts.length > 0
  const caution =
    message.answerStatus !== 'ANSWERED' || message.referral !== null
  const tone = emergency
    ? styles.emergency
    : caution
      ? styles.caution
      : styles.answer

  return (
    <div className={styles.row}>
      <div className={`${styles.bubble} ${tone}`}>
        {emergency && (
          <div className={styles.calls} aria-label={t('chat.emergency')}>
            {message.emergencyContacts.map((contact) => (
              <a
                key={contact.number}
                className={styles.emergencyCall}
                href={telHref(contact.number)}
                aria-label={t('chat.call', {
                  label: contact.label,
                  number: contact.number,
                })}
              >
                ☎ {contact.number} {contact.label}
              </a>
            ))}
          </div>
        )}
        <p className={styles.text}>{message.content}</p>
        {message.referral && (
          <div className={styles.referral}>
            <p className={styles.text}>{message.referral.notice}</p>
            <ul className={styles.plainList}>
              {message.referral.contacts.map((contact) => (
                <li key={`${contact.topic}-${contact.number}`}>
                  <a
                    href={telHref(contact.number)}
                    aria-label={t('chat.call', {
                      label: contact.label,
                      number: contact.number,
                    })}
                  >
                    ☎{contact.number}
                  </a>{' '}
                  {contact.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        {message.sources.length > 0 && (
          <ul className={styles.sources}>
            {[...message.sources]
              .sort((a, b) => a.order - b.order)
              .map((source) => (
                <SourceChip key={source.order} source={source} />
              ))}
          </ul>
        )}
        {onFeedback && message.answerStatus !== 'ERROR' && (
          <div className={styles.feedback}>
            <span>{t('chat.helpfulQuestion')}</span>
            {([true, false] as const).map((helpful) => (
              <button
                key={String(helpful)}
                type="button"
                className={styles.feedbackButton}
                aria-pressed={message.helpful === helpful}
                disabled={feedbackDisabled}
                onClick={() => onFeedback(helpful)}
              >
                {helpful ? t('chat.helpful') : t('chat.notHelpful')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** "답변을 찾고 있어요 · · ·" while the answer is on its way. */
export function ChatThinking() {
  const { t } = useTranslation()
  return (
    <div className={styles.row} role="status">
      <p className={`${styles.bubble} ${styles.answer}`}>
        {t('chat.thinking')}
        <span className={styles.dots} aria-hidden="true">
          {' '}
          · · ·
        </span>
      </p>
    </div>
  )
}
