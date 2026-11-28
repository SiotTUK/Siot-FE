import type { ReactNode } from 'react'
import haero from '@/shared/assets/mascot/haero.png'
// Transparent duo art (haero-toro.png has the canvas color baked in).
import haeroToro from '@/shared/assets/mascot/haero-toro-hug.png'
import toro from '@/shared/assets/mascot/toro.png'
import styles from './status-card.module.css'

const images = { haero, toro, duo: haeroToro }

/**
 * Figma v2 M13 card: a mascot beside a bold title and a short line, with an
 * optional full-width action under it ("연결이 잠깐 끊겼어요 · 다시 시도",
 * "페이지를 찾을 수 없어요 · 홈으로"). The picture is decorative.
 */
export function StatusCard({
  mascot,
  title,
  description,
  meta,
  action,
  role,
}: {
  mascot: keyof typeof images
  title: string
  description?: string
  meta?: string
  action?: ReactNode
  role?: 'alert' | 'status'
}) {
  return (
    <div className={styles.card} role={role}>
      <div className={styles.row}>
        <img
          className={styles.image}
          src={images[mascot]}
          alt=""
          width={56}
          height={56}
        />
        <div className={styles.text}>
          <strong>{title}</strong>
          {description && <p>{description}</p>}
          {meta && <p>{meta}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/**
 * Figma v2 M13 empty screen: a large mascot, a title and a short line,
 * centered ("아직 알림이 없어요").
 */
export function EmptyState({
  mascot = 'haero',
  title,
  description,
}: {
  mascot?: keyof typeof images
  title: string
  description?: string
}) {
  return (
    <div className={styles.empty}>
      <img
        className={styles.emptyImage}
        src={images[mascot]}
        alt=""
        width={120}
        height={120}
      />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  )
}
