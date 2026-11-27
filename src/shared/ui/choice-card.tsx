import type { ReactNode } from 'react'
import styles from './choice-card.module.css'

type ChoiceCardProps = {
  title: string
  description?: string
  selected: boolean
  /** radio = single choice (F01, F02, F04), checkbox = multiple (F05). */
  indicator?: 'radio' | 'checkbox'
  /** Tinted icon on the left; the indicator then moves right (F06a). */
  icon?: ReactNode
  lang?: string
  onClick: () => void
}

export function ChoiceCard({
  title,
  description,
  selected,
  indicator = 'radio',
  icon,
  lang,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      data-selected={selected}
      data-icon={icon ? true : undefined}
      aria-pressed={selected}
      onClick={onClick}
    >
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span className={styles[indicator]} aria-hidden="true" />
      )}
      <span className={styles.text}>
        {/* `lang` marks the title only; the description is in the screen language. */}
        <span className={styles.title} lang={lang}>
          {title}
        </span>
        {description && (
          <span className={styles.description}>{description}</span>
        )}
      </span>
      {icon && <span className={styles[indicator]} aria-hidden="true" />}
    </button>
  )
}

/** `grouped`: rows inside one white card (Figma v2 F05 checkboxes). */
export function ChoiceList({
  children,
  grouped = false,
}: {
  children: ReactNode
  grouped?: boolean
}) {
  return <div className={grouped ? styles.group : styles.list}>{children}</div>
}
