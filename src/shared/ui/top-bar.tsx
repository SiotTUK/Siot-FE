import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
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
    <header className={styles.bar} data-sticky-top="">
      <span className={styles.brand}>{brand}</span>
      <div className={styles.actions}>{children}</div>
    </header>
  )
}

/**
 * Icon action in the top bar (e.g. notifications): a link with `to`,
 * a button with `onClick`, otherwise disabled with `disabledHint` read by
 * screen readers ("준비 중"). `badge` is shown after the icon (Figma "🔔 2").
 */
export function TopBarIconButton({
  label,
  icon,
  badge,
  badgeLabel,
  disabledHint,
  to,
  onClick,
}: {
  label: string
  icon: ReactNode
  badge?: string
  /** Read instead of the bare badge, e.g. "안 읽은 알림 2개". */
  badgeLabel?: string
  disabledHint?: string
  to?: string
  onClick?: () => void
}) {
  const content = (
    <>
      {icon}
      {badge && (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      )}
      <span className="visually-hidden">
        {label}
        {badge && badgeLabel ? `, ${badgeLabel}` : ''}
        {!to && !onClick && disabledHint ? ` (${disabledHint})` : ''}
      </span>
    </>
  )
  if (to)
    return (
      <Link to={to} className={styles.iconButton}>
        {content}
      </Link>
    )
  return (
    <button
      type="button"
      className={styles.iconButton}
      disabled={!onClick}
      onClick={onClick}
    >
      {content}
    </button>
  )
}
