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
  const hintId = useId()
  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
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
        aria-describedby={hint ? hintId : undefined}
        className={styles.input}
      />
      <span className={styles.track} aria-hidden="true" />
    </label>
  )
}
