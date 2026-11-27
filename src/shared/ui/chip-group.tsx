import type { Ref } from 'react'
import styles from './chip-group.module.css'

/**
 * Category chips: one choice at a time (aria-pressed toggle buttons, so Tab
 * and Enter/Space work).
 * - `plain` (default, Figma M06 v1): words, the picked one as a small badge.
 * - `pill` (Figma v2 생활 수칙 · 분야): outlined pills in one scrolling row,
 *   the picked one filled with the brand color.
 */
export function ChipGroup<T extends string>({
  ref,
  label,
  options,
  value,
  onChange,
  variant = 'plain',
}: {
  ref?: Ref<HTMLDivElement>
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  variant?: 'plain' | 'pill'
}) {
  return (
    <div
      ref={ref}
      className={styles.group}
      data-variant={variant}
      role="group"
      aria-label={label}
    >
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
