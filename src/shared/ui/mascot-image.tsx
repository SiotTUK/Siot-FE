import haeroSit from '@/shared/assets/mascot/haero-sit.png'
import haeroToro from '@/shared/assets/mascot/haero-toro.png'
import haeroToroHug from '@/shared/assets/mascot/haero-toro-hug.png'
import toro from '@/shared/assets/mascot/toro.png'
import styles from './mascot-image.module.css'

/** Where Figma crops a square picture to the character (percent of the box). */
interface Crop {
  top: number
  left: number
  width: number
  height: number
}

/** Figma mascot pictures, at the size each one is drawn in the design. */
const poses: Record<
  string,
  { src: string; width: number; height: number; crop?: Crop }
> = {
  /** F01 언어 선택: 해로·토로 함께 */
  duo: { src: haeroToro, width: 169, height: 140 },
  /** F02 나의 상황: 토로 */
  toro: { src: toro, width: 120, height: 120 },
  /** F06 체류 만료일: 해로·토로가 기대 앉은 모습 */
  hug: { src: haeroToroHug, width: 134, height: 130 },
  /** M11b·M11c "mascot/toro": 토로만, 빈 여백 없이 */
  toroStand: {
    src: toro,
    width: 98,
    height: 140,
    crop: { top: -17, left: -36.8, width: 185.87, height: 129.75 },
  },
  /** M11d "mascot/haero1": 앉아서 윙크하는 해로 */
  haeroSit: {
    src: haeroSit,
    width: 104,
    height: 130,
    crop: { top: -27.2, left: -46.02, width: 186.32, height: 149.7 },
  },
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
  pose: 'duo' | 'toro' | 'hug' | 'toroStand' | 'haeroSit'
  height?: number
}) {
  const size = poses[pose]
  const scale = height ? height / size.height : 1
  const width = Math.round(size.width * scale)
  const boxHeight = Math.round(size.height * scale)
  if (size.crop)
    return (
      <span
        className={styles.crop}
        style={{ width, height: boxHeight }}
        aria-hidden="true"
      >
        <img
          src={size.src}
          alt=""
          style={{
            top: `${size.crop.top}%`,
            left: `${size.crop.left}%`,
            width: `${size.crop.width}%`,
            height: `${size.crop.height}%`,
          }}
        />
      </span>
    )
  return (
    <img
      className={styles.image}
      src={size.src}
      alt=""
      width={width}
      height={boxHeight}
    />
  )
}
