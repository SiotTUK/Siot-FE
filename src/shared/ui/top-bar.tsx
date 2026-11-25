import type { ReactNode } from 'react'
import styles from './top-bar.module.css'

/** M/TopBar: brand on the left, actions (language, notifications) on the right. */
export function TopBar({
  brand,
  children,
}: {
  brand: string
  children?: ReactNode
}) {
  return (
    <header className={styles.bar}>
      <span className={styles.brand}>{brand}</span>
      <div className={styles.actions}>{children}</div>
    </header>
  )
}

/**
 * Icon button in the top bar (e.g. notifications). Without `onClick` it is
 * shown disabled, with `disabledHint` read by screen readers ("준비 중").
 */
export function TopBarIconButton({
  label,
  icon,
  disabledHint,
  onClick,
}: {
  label: string
  icon: ReactNode
  disabledHint?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={styles.iconButton}
      disabled={!onClick}
      onClick={onClick}
    >
      {icon}
      <span className="visually-hidden">
        {label}
        {!onClick && disabledHint ? ` (${disabledHint})` : ''}
      </span>
    </button>
  )
}
