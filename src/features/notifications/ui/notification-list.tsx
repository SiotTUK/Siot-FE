import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { FormError } from '@/shared/ui/page'
import { InfiniteList } from '@/shared/ui/query-state'
import { EmptyState } from '@/shared/ui/status-card'
import type { NotificationItem } from '../api'
import {
  notificationDay,
  notificationGroup,
  notificationPath,
} from '../notifications'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../use-notifications'
import styles from './notifications.module.css'

/**
 * M09 알림 목록, newest first. Tapping one opens its screen (linkType) and
 * marks it read; one without a screen only marks read. "모두 읽음" sits above
 * the list while something is unread (not in Figma v2; placed with the team).
 */
export function NotificationList({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const notifications = useNotifications(memberId)
  const markRead = useMarkNotificationRead(memberId)
  const markAll = useMarkAllNotificationsRead(memberId)
  const unread = useUnreadCount(memberId).data ?? 0

  return (
    <>
      {unread > 0 && (
        <div className={styles.listTools}>
          <Button
            variant="text"
            disabled={markAll.isPending}
            onClick={markAll.markAll}
          >
            {t('notifications.readAll')}
          </Button>
        </div>
      )}
      {markAll.isError && (
        <FormError
          message={`${t('notifications.readAllFailed')} ${errorMessage(t, markAll.error)}`}
        />
      )}
      {markRead.isError && (
        <FormError
          message={`${t('notifications.readFailed')} ${errorMessage(t, markRead.error)}`}
        />
      )}
      <InfiniteList
        query={notifications}
        empty={
          <EmptyState
            title={t('notifications.emptyTitle')}
            description={t('notifications.emptyDescription')}
          />
        }
        getKey={(item) => item.notificationId}
        renderItem={(item) => (
          <NotificationCard
            item={item}
            pending={
              markRead.isPending &&
              markRead.variables?.notificationId === item.notificationId
            }
            onRead={(then) => markRead.markRead(item.notificationId, then)}
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
  /** Marks it read; `then` runs only after the server saved it. */
  onRead: (then?: () => void) => void
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
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
      {!item.read && (
        <span className="visually-hidden">{t('notifications.unreadMark')}</span>
      )}
    </>
  )

  const path = notificationPath(item)
  const read = item.read ? 'true' : undefined

  // With a destination: an unread one is marked read first and opens only
  // after that succeeds, so a failure stays here with its message and the
  // user can tap again. New-tab clicks open at once and mark read here.
  if (path)
    return (
      <Link
        to={path}
        state={backState}
        className={styles.card}
        data-read={read}
        aria-busy={pending || undefined}
        onClick={(event) => {
          if (item.read) return
          if (!isPlainClick(event)) return onRead()
          event.preventDefault()
          if (!pending) onRead(() => navigate(path, { state: backState }))
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
      onClick={() => onRead()}
    >
      {content}
    </button>
  )
}

const backState = { from: '/notifications' }

/** A left click without modifier keys, i.e. not "open in new tab/window". */
function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}
