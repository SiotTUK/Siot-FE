import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './screen-header.module.css'

type Back = { label: string } & ({ to: string } | { onClick: () => void })

/**
 * Header of full-screen views (onboarding, chat, admin, edit screens):
 * ‹ back, optional title, actions on the right, optional `n / total` progress.
 */
export function ScreenHeader({
  back,
  title,
  actions,
  progress,
}: {
  back?: Back
  title?: string
  actions?: ReactNode
  progress?: { current: number; total: number; label: string }
}) {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        {back &&
          ('to' in back ? (
            <Link className={styles.back} to={back.to} aria-label={back.label}>
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
      {progress && (
        <>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={progress.total}
            aria-valuenow={progress.current}
            aria-valuetext={progress.label}
          >
            {Array.from({ length: progress.total }, (_, index) => (
              <span key={index} data-done={index < progress.current} />
            ))}
          </div>
          <p className={styles.step}>{progress.label}</p>
        </>
      )}
    </header>
  )
}

/** Small text button or link for the header's right side (기록 · 새 대화 · 건너뛰기). */
export function HeaderAction({
  children,
  ...props
}: { children: ReactNode } & (
  | { to: string; onClick?: () => void }
  | { onClick: () => void; disabled?: boolean }
)) {
  return 'to' in props ? (
    <Link className={styles.action} to={props.to} onClick={props.onClick}>
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
