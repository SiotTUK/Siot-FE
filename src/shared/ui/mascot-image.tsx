import haeroToro from '@/shared/assets/mascot/haero-toro.png'
import haeroToroHug from '@/shared/assets/mascot/haero-toro-hug.png'
import toro from '@/shared/assets/mascot/toro.png'
import styles from './mascot-image.module.css'

/** Figma mascot pictures, at the size each one is drawn in the design. */
const poses = {
  /** F01 언어 선택: 해로·토로 함께 */
  duo: { src: haeroToro, width: 169, height: 140 },
  /** F02 나의 상황: 토로 */
  toro: { src: toro, width: 120, height: 120 },
  /** F06 체류 만료일: 해로·토로가 기대 앉은 모습 */
  hug: { src: haeroToroHug, width: 134, height: 130 },
}

/**
 * A centered, decorative mascot picture (`alt=""`; the text around it
 * carries the meaning). For a mascot with a message use MascotTip.
 * `height` draws it smaller (e.g. inside the home hero card).
 */
export function MascotImage({
  pose,
  height,
}: {
  pose: keyof typeof poses
  height?: number
}) {
  const size = poses[pose]
  const scale = height ? height / size.height : 1
  return (
    <img
      className={styles.image}
      src={size.src}
      alt=""
      width={Math.round(size.width * scale)}
      height={Math.round(size.height * scale)}
    />
  )
}
