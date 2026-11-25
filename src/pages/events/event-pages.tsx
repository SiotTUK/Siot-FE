import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import type { EventDetail } from '@/features/events/api'
import {
  eventLink,
  formatEventDates,
  formatEventTimes,
} from '@/features/events/event-display'
import { EventImage } from '@/features/events/ui/event-image'
import { EventQueryNotice } from '@/features/events/ui/event-query-notice'
import { useEventDetail } from '@/features/events/use-events'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Tag } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import styles from './event-pages.module.css'

export function EventDetailPage() {
  const { t } = useTranslation()
  const { eventId } = useParams()
  const { data: member } = useMe()

  return (
    <>
      <ScreenHeader
        title={t('events.detail')}
        back={{ to: '/home', label: t('common.back') }}
      />
      <PageBody className={styles.detail}>
        {eventId && /^[1-9]\d{0,18}$/.test(eventId) ? (
          member && (
            <EventDetailContent memberId={member.id} eventId={eventId} />
          )
        ) : (
          <Muted>{t('events.notFound')}</Muted>
        )}
      </PageBody>
    </>
  )
}

function EventDetailContent({
  memberId,
  eventId,
}: {
  memberId: number
  eventId: string
}) {
  const { t } = useTranslation()
  const query = useEventDetail(memberId, eventId)
  if (query.error instanceof ApiError && query.error.status === 404)
    return <Muted>{t('events.notFound')}</Muted>

  if (!query.data)
    return (
      <EventQueryNotice
        pending={query.isPending}
        fetching={query.isFetching}
        retry={() => void query.refetch()}
      />
    )

  return <EventDetails event={query.data} />
}

function EventDetails({ event }: { event: EventDetail }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const dates = formatEventDates(event, language)
  const times = formatEventTimes(event, language)
  const applicationUrl = eventLink(event.applicationUrl)
  const sourceUrl = eventLink(event.sourceUrl)
  const deadlineDate = new Date(event.applicationDeadline ?? '')
  const deadline = Number.isFinite(deadlineDate.getTime())
    ? new Intl.DateTimeFormat(language, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Seoul',
      }).format(deadlineDate)
    : null

  return (
    <>
      <div className={styles.cover} aria-hidden="true">
        <EventImage url={event.thumbnailUrl} />
      </div>
      {(event.multicultural || !event.translated) && (
        <div className={styles.tags}>
          {event.multicultural && (
            <Tag tone="main">{t('events.multicultural')}</Tag>
          )}
          {!event.translated && (
            <Tag tone="warning">{t('events.translationPending')}</Tag>
          )}
        </div>
      )}
      <h2 className={styles.title} lang={event.language}>
        {event.title}
      </h2>
      <dl className={styles.facts}>
        <div>
          <dt>{t('events.date')}</dt>
          <dd>{dates ?? t('events.dateUnknown')}</dd>
          {(times || event.timeUnknown) && (
            <dd>{times || t('events.timeUnknown')}</dd>
          )}
        </div>
        {event.venue && (
          <div>
            <dt>{t('events.venue')}</dt>
            <dd lang={event.language}>{event.venue}</dd>
          </div>
        )}
        {event.priceInfo && (
          <div>
            <dt>{t('events.price')}</dt>
            <dd>{event.priceInfo}</dd>
          </div>
        )}
        {deadline && (
          <div>
            <dt>{t('events.deadline')}</dt>
            <dd>{deadline}</dd>
          </div>
        )}
        {event.description && (
          <div>
            <dt>{t('events.description')}</dt>
            <dd lang={event.language} className={styles.description}>
              {event.description}
            </dd>
          </div>
        )}
      </dl>
      {(applicationUrl || sourceUrl) && (
        <div className={styles.links}>
          {applicationUrl && (
            <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
              {t('events.apply')}
            </a>
          )}
          {sourceUrl && sourceUrl !== applicationUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {t('events.original')}
            </a>
          )}
        </div>
      )}
    </>
  )
}
