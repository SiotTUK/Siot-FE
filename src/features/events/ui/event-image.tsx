import { useState } from 'react'
import { eventLink } from '../event-display'
import styles from './event-image.module.css'

export function EventImage({ url }: { url?: string | null }) {
  const [loaded, setLoaded] = useState<string>()
  const src = eventLink(url ?? null)
  if (!src) return null

  return (
    <img
      key={src}
      className={styles.image}
      data-loaded={src === loaded}
      src={src}
      alt=""
      loading="lazy"
      onLoad={() => setLoaded(src)}
    />
  )
}
