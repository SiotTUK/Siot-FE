import { useTranslation } from 'react-i18next'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { questionMaxLength } from '../api'
import styles from './chat.module.css'

/** Privacy note + one-line input + round send button (Figma v2 M08a). */
export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  busy,
  disabled,
  error,
}: {
  draft: string
  onDraftChange: (value: string) => void
  onSend: (text: string) => void
  busy: boolean
  disabled?: boolean
  error?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={styles.composer}>
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
        <button
          type="submit"
          aria-label={t('chat.send')}
          disabled={!draft.trim() || busy || disabled}
        >
          <ArrowRightIcon />
        </button>
      </form>
    </div>
  )
}
