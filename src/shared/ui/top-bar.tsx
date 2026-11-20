import type { ReactNode } from 'react'
import styles from './top-bar.module.css'

/** M/TopBar: brand on the left, actions (language, later notifications) on the right. */
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
