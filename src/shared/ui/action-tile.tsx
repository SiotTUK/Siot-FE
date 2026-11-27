import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from './icons'
import styles from './action-tile.module.css'

/**
 * Figma v2 home tile: tinted card with a white icon box, a title, one line of
 * description and ›. With `to` it is a link; without, a plain card where
 * `trailing` (e.g. a "준비 중" tag) takes the place of ›.
 */
export function ActionTile({
  icon,
  title,
  description,
  tone = 'info',
  trailing,
  to,
}: {
  icon: ReactNode
  title: string
  description: string
  tone?: 'info' | 'warning'
  trailing?: ReactNode
  to?: string
}) {
  const content = (
    <>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      {trailing ?? <ChevronRightIcon className={styles.chevron} />}
    </>
  )
  return to ? (
    <Link to={to} className={styles.tile} data-tone={tone}>
      {content}
    </Link>
  ) : (
    <div className={styles.tile} data-tone={tone}>
      {content}
    </div>
  )
}
