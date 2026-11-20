import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import styles from './text-field.module.css'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** Red 12px message right under the input. */
  error?: string
  /** Shown under the input when there is no error. */
  help?: ReactNode
  helpTone?: 'default' | 'success'
  /** Inline action on the right, e.g. "코드 보내기". */
  action?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function TextField({
  label,
  error,
  help,
  helpTone = 'default',
  action,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? help
  return (
    <div className={`${styles.field} ${className ?? ''}`.trim()}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          {...inputProps}
          id={id}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
        />
        {action}
      </div>
      {message && (
        <div
          id={messageId}
          className={
            error
              ? styles.error
              : helpTone === 'success'
                ? styles.success
                : styles.help
          }
          role={error ? 'alert' : undefined}
        >
          {message}
        </div>
      )}
    </div>
  )
}
