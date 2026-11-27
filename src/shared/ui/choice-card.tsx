import type { ReactNode } from 'react'
import styles from './choice-card.module.css'

type ChoiceCardProps = {
  title: string
  description?: string
  selected: boolean
  /** radio = single choice (F01, F02, F04), checkbox = multiple (F05). */
  indicator?: 'radio' | 'checkbox'
  lang?: string
  onClick: () => void
}

export function ChoiceCard({
  title,
  description,
  selected,
  indicator = 'radio',
  lang,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      data-selected={selected}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={styles[indicator]} aria-hidden="true" />
      <span className={styles.text}>
        {/* `lang` marks the title only; the description is in the screen language. */}
        <span className={styles.title} lang={lang}>
          {title}
        </span>
        {description && (
          <span className={styles.description}>{description}</span>
        )}
      </span>
    </button>
  )
}

export function ChoiceList({ children }: { children: ReactNode }) {
  return <div className={styles.list}>{children}</div>
}
