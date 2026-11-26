import type { InputHTMLAttributes } from 'react'
import styles from './switch-field.module.css'

/**
 * On/off row: label on the left, toggle on the right (Figma M09 settings).
 * A native checkbox with role="switch", so Tab and Space work and screen
 * readers announce on/off.
 */
export function SwitchField({
  label,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & {
  label: string
}) {
  return (
    <label className={styles.row}>
      <span className={styles.label}>{label}</span>
      <input
        {...input}
        type="checkbox"
        role="switch"
        className={styles.input}
      />
      <span className={styles.track} aria-hidden="true" />
    </label>
  )
}
