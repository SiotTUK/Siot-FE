import type { ReactNode } from 'react'
import styles from './mobile-frame.module.css'

/** Mobile-only layout: 480px max, centered, grey outside on wide screens. */
export function MobileFrame({ children }: { children: ReactNode }) {
  return <div className={styles.frame}>{children}</div>
}

export function PageBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main className={`${styles.body} ${className ?? ''}`.trim()}>
      {children}
    </main>
  )
}

export function PageLoader({ label }: { label: string }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
