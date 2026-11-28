import type { ReactNode } from 'react'
import styles from './page.module.css'

export function PageHeading({
  title,
  description,
  aside,
  children,
}: {
  title: string
  description?: string
  /** Small text on the title's right, e.g. M12 "갱신 11.13 03:00". */
  aside?: ReactNode
  children?: ReactNode
}) {
  const heading = <h1 className={styles.title}>{title}</h1>
  return (
    <div className={styles.heading}>
      {aside ? (
        <div className={styles.headingRow}>
          {heading}
          {aside}
        </div>
      ) : (
        heading
      )}
      {children}
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}

/** Section with an h2 title and an optional trailing action. */
export function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  const heading = <h2 className={styles.sectionTitle}>{title}</h2>

  return (
    <section className={styles.section}>
      {action ? (
        <div className={styles.sectionHeader}>
          {heading}
          {action}
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  )
}

/** Vertical stack for form fields and sections. */
export function Stack({
  children,
  gap = 20,
  as: Tag = 'div',
}: {
  children: ReactNode
  gap?: number
  as?: 'div' | 'ul'
}) {
  return (
    <Tag className={styles.stack} style={{ gap }}>
      {children}
    </Tag>
  )
}

/** Wrapping row: filters, inline actions (aligned to the end by default). */
export function Toolbar({
  children,
  justify = 'end',
}: {
  children: ReactNode
  justify?: 'end' | 'between'
}) {
  return (
    <div className={styles.toolbar} data-justify={justify}>
      {children}
    </div>
  )
}

/** Pins the main action to the bottom of the screen. */
export function BottomArea({ children }: { children: ReactNode }) {
  return (
    <div className={styles.bottom} data-sticky-bottom="">
      {children}
    </div>
  )
}

/** Bordered box for list items and grouped rows. */
export function Card({
  children,
  as: Tag = 'div',
}: {
  children: ReactNode
  as?: 'div' | 'li'
}) {
  return <Tag className={styles.card}>{children}</Tag>
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'note' | 'success' | 'danger'
  title?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`${styles.notice} ${styles[tone]}`}
      role={tone === 'success' ? 'status' : undefined}
    >
      {title && <strong className={styles.noticeTitle}>{title}</strong>}
      {children}
    </div>
  )
}

/** Small label: 준비 중 · 관리자 · 안 됐어요 ... */
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'main' | 'danger' | 'warning'
}) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>
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

export function Muted({ children }: { children: ReactNode }) {
  return <p className={styles.muted}>{children}</p>
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className={styles.formError} role="alert">
      {message}
    </p>
  )
}
