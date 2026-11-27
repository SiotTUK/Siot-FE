import { useTranslation } from 'react-i18next'
import haero from '@/shared/assets/mascot/haero.png'
import toro from '@/shared/assets/mascot/toro.png'
import styles from './mascot-tip.module.css'

const images = { haero, toro }

/**
 * Figma "웰컴시흥/MascotTip": a mascot with its name and a short line.
 * 해로 (sea turtle) welcomes, 토로 (land turtle) helps. The name comes from
 * the shared `common.mascots` text. The picture is decorative; the name and
 * message carry the meaning.
 */
export function MascotTip({
  mascot,
  children,
}: {
  mascot: 'haero' | 'toro'
  children: string
}) {
  const { t } = useTranslation()
  return (
    <div className={styles.tip} data-mascot={mascot}>
      <img
        className={styles.image}
        src={images[mascot]}
        alt=""
        width={56}
        height={56}
      />
      <p className={styles.text}>
        <span className={styles.name}>{t(`common.mascots.${mascot}`)}</span>
        {children}
      </p>
    </div>
  )
}
