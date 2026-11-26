import type { Ref } from 'react'
import styles from './chip-group.module.css'

/**
 * Figma M06 category chips: one choice at a time, the picked one filled.
 * Plain toggle buttons (aria-pressed) so Tab and Enter/Space work.
 */
export function ChipGroup<T extends string>({
  ref,
  label,
  options,
  value,
  onChange,
}: {
  ref?: Ref<HTMLDivElement>
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div ref={ref} className={styles.group} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          value={option.value}
          className={styles.chip}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
