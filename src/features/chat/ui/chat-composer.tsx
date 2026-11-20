import { useTranslation } from 'react-i18next'
import { questionMaxLength } from '../api'
import styles from './chat.module.css'

/** Suggested questions + privacy note + input (M08a·b). */
export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  suggestions = [],
  busy,
  disabled,
  error,
}: {
  draft: string
  onDraftChange: (value: string) => void
  onSend: (text: string) => void
  suggestions?: string[]
  busy: boolean
  disabled?: boolean
  error?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={styles.composer}>
      {suggestions.length > 0 && (
        <ul className={styles.suggestions} aria-label={t('chat.suggestions')}>
          {suggestions.map((question) => (
            <li key={question}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onSend(question)}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p className={styles.privacy}>{t('chat.privacy')}</p>
      <form
        className={styles.inputRow}
        onSubmit={(event) => {
          event.preventDefault()
          onSend(draft)
        }}
      >
        <textarea
          aria-label={t('chat.inputLabel')}
          rows={1}
          maxLength={questionMaxLength}
          placeholder={t('chat.placeholder')}
          value={draft}
          disabled={disabled}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter breaks the line; ignore Enter ending IME input.
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              onSend(draft)
            }
          }}
        />
        <button type="submit" disabled={!draft.trim() || busy || disabled}>
          {t('chat.send')}
        </button>
      </form>
    </div>
  )
}
