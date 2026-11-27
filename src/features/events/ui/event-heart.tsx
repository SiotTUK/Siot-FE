import { useTranslation } from 'react-i18next'
import { HeartIcon } from '@/shared/ui/icons'
import { useEventHeart } from '../use-event-heart'
import styles from './event-heart.module.css'

/** ♥ toggle on event cards (Figma v2). Pressed = saved (subscribed). */
export function EventHeart({
  memberId,
  eventId,
  saved,
  title,
}: {
  memberId: number
  eventId: number
  saved: boolean
  title: string
}) {
  const { t } = useTranslation()
  const heart = useEventHeart(memberId, eventId, saved)
  return (
    <button
      type="button"
      className={styles.heart}
      aria-pressed={heart.liked}
      aria-label={`${title} ${t(heart.liked ? 'events.heart.remove' : 'events.heart.save')}`}
      title={heart.error ? t('events.heart.saveError') : undefined}
      disabled={heart.pending}
      onClick={heart.toggle}
    >
      <HeartIcon filled={heart.liked} />
    </button>
  )
}
