import { useQueries } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { eventKeys, fetchEventDetail } from '@/features/events/api'
import { formatEventDates } from '@/features/events/event-display'
import { EventHeart } from '@/features/events/ui/event-heart'
import { useSavedEventIdList } from '@/features/events/use-events'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { ChevronRightIcon } from '@/shared/ui/icons'
import { FormError, Muted } from '@/shared/ui/page'
import styles from './notifications.module.css'

/**
 * M09 "찜한 행사 N개 · 관리 ›" (v2 renamed 신청 to 찜). 관리 opens the list
 * here: each event links to its detail and its ♥ removes it. The
 * subscription list has IDs only, so titles come from each event's detail.
 */
export function SavedEvents({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const saved = useSavedEventIdList(memberId)
  const ids = saved.data ?? []

  return (
    <div className={styles.saved}>
      <div className={styles.savedRow}>
        <span>{t('notifications.settings.saved', { count: ids.length })}</span>
        <button
          type="button"
          className={styles.savedToggle}
          aria-expanded={open}
          aria-controls={listId}
          disabled={!saved.isSuccess}
          onClick={() => setOpen(!open)}
        >
          {t(
            open
              ? 'notifications.settings.savedClose'
              : 'notifications.settings.savedManage',
          )}
          <ChevronRightIcon aria-hidden="true" data-open={open || undefined} />
        </button>
      </div>
      {saved.isError && (
        <FormError message={t('notifications.settings.savedError')} />
      )}
      <div id={listId} hidden={!open}>
        {open &&
          (ids.length ? (
            <SavedEventList memberId={memberId} ids={ids} />
          ) : (
            <Muted>{t('notifications.settings.savedEmpty')}</Muted>
          ))}
      </div>
    </div>
  )
}

function SavedEventList({
  memberId,
  ids,
}: {
  memberId: number
  ids: number[]
}) {
  const { t } = useTranslation()
  const details = useQueries({
    queries: ids.map((id) => ({
      queryKey: eventKeys.detail(memberId, String(id)),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchEventDetail(String(id), signal),
      retry: (count: number, error: Error) =>
        !(error instanceof ApiError && error.status === 404) && count < 2,
    })),
  })

  return (
    <ul className={styles.savedList}>
      {ids.map((id, index) => {
        const query = details[index]
        const event = query.data
        const title = event
          ? event.title
          : query.isPending
            ? t('common.loading')
            : t('notifications.settings.savedUnavailable')
        return (
          <li key={id} className={styles.savedItem}>
            <div className={styles.savedText}>
              {event ? (
                <Link
                  to={`/events/${id}`}
                  state={{ from: '/notifications' }}
                  lang={event.language}
                >
                  {event.title}
                </Link>
              ) : (
                <span>{title}</span>
              )}
              {event && (
                <small>
                  {formatEventDates(event, currentLanguage()) ??
                    t('events.dateUnknown')}
                </small>
              )}
            </div>
            <EventHeart memberId={memberId} eventId={id} saved title={title} />
          </li>
        )
      })}
    </ul>
  )
}
