import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/shared/i18n/error-message'
import { FormError } from '@/shared/ui/page'
import { InfiniteList } from '@/shared/ui/query-state'
import type { NotificationItem } from '../api'
import {
  notificationDay,
  notificationGroup,
  notificationPath,
} from '../notifications'
import { useMarkNotificationRead, useNotifications } from '../use-notifications'
import styles from './notifications.module.css'

/**
 * M09 알림 목록, newest first. Tapping one opens its screen (linkType) and
 * marks it read; one without a screen only marks read.
 */
export function NotificationList({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const notifications = useNotifications(memberId)
  const markRead = useMarkNotificationRead(memberId)

  return (
    <>
      {markRead.isError && (
        <FormError message={errorMessage(t, markRead.error)} />
      )}
      <InfiniteList
        query={notifications}
        empty={t('notifications.empty')}
        getKey={(item) => item.notificationId}
        renderItem={(item) => (
          <NotificationCard
            item={item}
            pending={
              markRead.isPending && markRead.variables === item.notificationId
            }
            onRead={() => markRead.mutate(item.notificationId)}
          />
        )}
      />
    </>
  )
}

function NotificationCard({
  item,
  pending,
  onRead,
}: {
  item: NotificationItem
  pending: boolean
  onRead: () => void
}) {
  const { t, i18n } = useTranslation()
  const day = notificationDay(item.createdAt, i18n.language)
  const when = 'relative' in day ? t(`notifications.${day.relative}`) : day.date
  const content = (
    <>
      <span className={styles.badge}>
        {t(`notifications.groups.${notificationGroup(item.kind)}`)} · {when}
      </span>
      <span className={styles.title}>
        {!item.read && <span className={styles.dot} aria-hidden="true" />}
        {item.title}
      </span>
      {item.body && <span className={styles.body}>{item.body}</span>}
      {!item.read && (
        <span className="visually-hidden">{t('notifications.unreadMark')}</span>
      )}
    </>
  )

  const path = notificationPath(item)
  const read = item.read ? 'true' : undefined

  // With a destination: a link that also marks it read on the way.
  if (path)
    return (
      <Link
        to={path}
        state={{ from: '/notifications' }}
        className={styles.card}
        data-read={read}
        onClick={() => {
          if (!item.read) onRead()
        }}
      >
        {content}
      </Link>
    )

  // Without one: read cards are plain, unread ones are buttons that mark read.
  return item.read ? (
    <article className={styles.card} data-read="true">
      {content}
    </article>
  ) : (
    <button
      type="button"
      className={styles.card}
      disabled={pending}
      onClick={onRead}
    >
      {content}
    </button>
  )
}
