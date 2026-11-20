import type { ReactNode } from 'react'
import styles from './page.module.css'

export function PageHeading({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className={styles.heading}>
      <h1 className={styles.title}>{title}</h1>
      {children}
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}

/** Vertical stack for form fields and sections. */
export function Stack({
  children,
  gap = 20,
}: {
  children: ReactNode
  gap?: number
}) {
  return (
    <div className={styles.stack} style={{ gap }}>
      {children}
    </div>
  )
}

/** Pins the main action to the bottom of the screen. */
export function BottomArea({ children }: { children: ReactNode }) {
  return <div className={styles.bottom}>{children}</div>
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'note' | 'success'
  title?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`${styles.notice} ${styles[tone]}`}
      role={tone === 'success' ? 'status' : undefined}
    >
      {title && <strong className={styles.noticeTitle}>{title}</strong>}
      {children && <span>{children}</span>}
    </div>
  )
}

/** "처음이신가요? 회원가입" style footer line. */
export function InlineLink({
  text,
  children,
}: {
  text: string
  children: ReactNode
}) {
  return (
    <p className={styles.inlineLink}>
      <span>{text}</span> {children}
    </p>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className={styles.formError} role="alert">
      {message}
    </p>
  )
}
