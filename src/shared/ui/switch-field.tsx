import { useId, type InputHTMLAttributes } from 'react'
import styles from './switch-field.module.css'

/**
 * On/off row: label on the left, toggle on the right (Figma M09 settings).
 * A native checkbox with role="switch", so Tab and Space work and screen
 * readers announce on/off. `hint` adds a line under the label that screen
 * readers read with the switch.
 */
export function SwitchField({
  label,
  hint,
  ...input
}: Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'role' | 'aria-describedby'
> & {
  label: string
  hint?: string
}) {
  const id = useId()
  const labelId = `${id}-label`
  const hintId = `${id}-hint`
  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {hint && (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        )}
      </span>
      <input
        {...input}
        type="checkbox"
        role="switch"
        aria-labelledby={
          input['aria-labelledby'] ??
          (input['aria-label'] ? undefined : labelId)
        }
        aria-describedby={hint ? hintId : undefined}
        className={styles.input}
      />
      <span className={styles.track} aria-hidden="true" />
    </label>
  )
}
