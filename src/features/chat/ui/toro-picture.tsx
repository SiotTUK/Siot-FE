import toro from '@/shared/assets/mascot/toro.png'
import styles from './toro-picture.module.css'

/**
 * "토로 프로필" on the chat screens (Figma v2 M08a/M08b): toro.png cropped
 * to the face in a light-yellow circle. 72 on the intro, 32 beside the
 * greeting, 28 on an answer. Decorative; the text beside it names 토로.
 */
export function ToroAvatar({ size }: { size: 72 | 32 | 28 }) {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img src={toro} alt="" />
    </span>
  )
}
