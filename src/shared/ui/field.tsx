import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import styles from './field.module.css'

type ControlProps = {
  id: string
  className: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

type FieldProps = {
  label: string
  /** Red 12px message right under the control. */
  error?: string
  /** Shown under the control when there is no error. */
  help?: ReactNode
  helpTone?: 'default' | 'success'
  /** Inline action on the right, e.g. "코드 보내기". */
  action?: ReactNode
  /** Keep the label for screen readers only (placeholder-only designs). */
  hideLabel?: boolean
  className?: string
}

/** Label + control + message. All form controls share this layout. */
function Field({
  label,
  error,
  help,
  helpTone = 'default',
  action,
  hideLabel,
  className,
  children,
}: FieldProps & { children: (control: ControlProps) => ReactNode }) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? help
  return (
    <div className={`${styles.field} ${className ?? ''}`.trim()}>
      <label
        className={hideLabel ? 'visually-hidden' : styles.label}
        htmlFor={id}
      >
        {label}
      </label>
      <div className={styles.row}>
        {children({
          id,
          className: styles.control,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': message ? messageId : undefined,
        })}
        {action}
      </div>
      {message && (
        <div
          id={messageId}
          className={styles[error ? 'error' : helpTone]}
          role={error ? 'alert' : undefined}
        >
          {message}
        </div>
      )}
    </div>
  )
}

type Own<T> = Omit<T, keyof FieldProps | 'className'> & FieldProps

export function TextField({
  label,
  error,
  help,
  helpTone,
  action,
  hideLabel,
  className,
  ref,
  ...input
}: Own<InputHTMLAttributes<HTMLInputElement>> & {
  ref?: Ref<HTMLInputElement>
}) {
  return (
    <Field {...{ label, error, help, helpTone, action, hideLabel, className }}>
      {(control) => <input {...input} {...control} ref={ref} />}
    </Field>
  )
}

export function TextAreaField({
  label,
  error,
  help,
  className,
  ref,
  rows = 3,
  ...textarea
}: Own<TextareaHTMLAttributes<HTMLTextAreaElement>> & {
  ref?: Ref<HTMLTextAreaElement>
}) {
  return (
    <Field {...{ label, error, help, className }}>
      {(control) => (
        <textarea {...textarea} {...control} rows={rows} ref={ref} />
      )}
    </Field>
  )
}

export function SelectField({
  label,
  error,
  options,
  className,
  ref,
  ...select
}: Own<SelectHTMLAttributes<HTMLSelectElement>> & {
  options: { value: string; label: string }[]
  ref?: Ref<HTMLSelectElement>
}) {
  return (
    <Field {...{ label, error, className }}>
      {(control) => (
        <select {...select} {...control} ref={ref}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

export function CheckField({
  label,
  ref,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  ref?: Ref<HTMLInputElement>
}) {
  return (
    <label className={styles.check}>
      <input {...input} ref={ref} type="checkbox" />
      {label}
    </label>
  )
}
