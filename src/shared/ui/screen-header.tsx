import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './screen-header.module.css'

/** `state` rides along with a `to` link, e.g. the way back to a chat (CB-10). */
type Back = { label: string } & (
  { to: string; state?: unknown } | { onClick: () => void }
)

/**
 * Header of full-screen views (onboarding, chat, admin, edit screens):
 * ‹ back, optional title, actions on the right. Onboarding's `n / total`
 * bar lives in the page body (StepProgress, Figma v2).
 */
export function ScreenHeader({
  back,
  title,
  actions,
}: {
  back?: Back
  title?: string
  actions?: ReactNode
}) {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        {back &&
          ('to' in back ? (
            <Link
              className={styles.back}
              to={back.to}
              state={back.state}
              aria-label={back.label}
            >
              <span aria-hidden="true">‹</span>
            </Link>
          ) : (
            <button
              type="button"
              className={styles.back}
              onClick={back.onClick}
              aria-label={back.label}
            >
              <span aria-hidden="true">‹</span>
            </button>
          ))}
        {title && <h1 className={styles.title}>{title}</h1>}
        <div className={styles.actions}>{actions}</div>
      </div>
    </header>
  )
}

/** Small text button or link for the header's right side (기록 · 새 대화 · 건너뛰기). */
export function HeaderAction({
  children,
  ...props
}: { children: ReactNode } & (
  | { to: string; state?: unknown; onClick?: () => void }
  | { onClick: () => void; disabled?: boolean }
)) {
  return 'to' in props ? (
    <Link
      className={styles.action}
      to={props.to}
      state={props.state}
      onClick={props.onClick}
    >
      {children}
    </Link>
  ) : (
    <button
      type="button"
      className={styles.action}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {children}
    </button>
  )
}
