import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import { chatEntryState } from '@/features/chat/chat-entry'
import type { EventDetail } from '@/features/events/api'
import {
  eventLink,
  formatEventDates,
  formatEventTimes,
} from '@/features/events/event-display'
import {
  isDateRangeValid,
  parseEventFilters,
  withEventFilters,
} from '@/features/events/event-filters'
import { eventDetailBackPath, isEventId } from '@/features/events/event-routes'
import { EventCard } from '@/features/events/ui/event-card'
import { EventImage } from '@/features/events/ui/event-image'
import { EventListFilters } from '@/features/events/ui/event-list-filters'
import { EventQueryNotice } from '@/features/events/ui/event-query-notice'
import { EventRecommendations } from '@/features/events/ui/event-recommendations'
import { EventAlerts } from '@/features/events/ui/event-alerts'
import { EventHeart } from '@/features/events/ui/event-heart'
import { EventReport } from '@/features/events/ui/event-report'
import {
  useEventDetail,
  useEvents,
  useSavedEventIds,
} from '@/features/events/use-events'
import { useEventHeart } from '@/features/events/use-event-heart'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { Button, ButtonLink } from '@/shared/ui/button'
import {
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  MapPinIcon,
  ShareIcon,
  TicketIcon,
} from '@/shared/ui/icons'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { TextField } from '@/shared/ui/field'
import { PageBody } from '@/shared/ui/mobile-frame'
import {
  BottomArea,
  FormError,
  Muted,
  PageHeading,
  Section,
  Tag,
} from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import { shareEvent } from '@/features/events/share-event'
import styles from './event-pages.module.css'

export function EventsPage() {
  const { t } = useTranslation()
  const { data: member } = useMe()

  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('events.title')} />
      {member && (
        <>
          <EventRecommendations memberId={member.id} layout="featured" />
          <EventList memberId={member.id} />
        </>
      )}
    </PageBody>
  )
}

function EventList({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const requestedPage = Number(params.get('page'))
  const page =
    Number.isInteger(requestedPage) &&
    requestedPage >= 0 &&
    requestedPage <= 2_147_483_647
      ? requestedPage
      : 0
  const filters = parseEventFilters(params)
  const rangeValid = isDateRangeValid(filters)
  const query = useEvents(memberId, page, filters)
  const saved = useSavedEventIds(memberId)
  const data = query.data
  const lastPage = data ? Math.max(0, data.totalPages - 1) : page
  const rangeRejected =
    query.error instanceof ApiError &&
    query.error.status === 400 &&
    query.error.code === 'INVALID_INPUT' &&
    Boolean(filters.from || filters.to)

  const pageParams = (nextPage: number) => {
    const nextParams = new URLSearchParams(params)
    if (nextPage === 0) nextParams.delete('page')
    else nextParams.set('page', String(nextPage))
    return nextParams
  }

  const filterArea = (
    <EventListFilters
      filters={filters}
      onChange={(next) =>
        setParams(withEventFilters(params, next), { preventScrollReset: true })
      }
    />
  )

  if (query.isSuccess && page > lastPage) {
    return (
      <Section title={t('events.all')}>
        {filterArea}
        <EventQueryNotice
          pending
          fetching={query.isFetching}
          retry={() => void query.refetch()}
        />
        {!query.isFetching && (
          <Navigate replace to={{ search: pageParams(lastPage).toString() }} />
        )}
      </Section>
    )
  }

  return (
    <Section title={t('events.all')}>
      {filterArea}
      {!rangeValid ? null : rangeRejected ? (
        <FormError message={t('events.invalidRange')} />
      ) : query.isPending || query.isError ? (
        <EventQueryNotice
          pending={query.isPending}
          fetching={query.isFetching}
          retry={() => void query.refetch()}
        />
      ) : data?.content.length ? (
        <ul className={styles.list}>
          {data.content.map((event) => (
            <li key={event.eventId}>
              <EventCard
                event={event}
                memberId={memberId}
                saved={saved.has(event.eventId)}
                variant="row"
              />
            </li>
          ))}
        </ul>
      ) : (
        <Muted>
          {filters.from || filters.to
            ? t('events.emptyFiltered')
            : t(`events.emptyStatus.${filters.status}`)}
        </Muted>
      )}
      {rangeValid && data && (page > 0 || data.hasNext) && (
        <div className={styles.pager}>
          <Button
            variant="secondary"
            disabled={page === 0}
            onClick={() => setParams(pageParams(page - 1))}
          >
            {t('events.previous')}
          </Button>
          <span>
            {t('events.page', { current: page + 1, total: data.totalPages })}
          </span>
          <Button
            variant="secondary"
            disabled={!data.hasNext}
            onClick={() => setParams(pageParams(page + 1))}
          >
            {t('events.next')}
          </Button>
        </div>
      )}
    </Section>
  )
}

export function EventDetailPage() {
  const { t } = useTranslation()
  const { eventId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { data: member } = useMe()
  const from = state?.from
  const detail = useEventDetailIfValid(member?.id, eventId)

  return (
    <>
      <ScreenHeader
        title={t('events.detail')}
        back={
          from === 'calendar'
            ? { onClick: () => void navigate(-1), label: t('common.back') }
            : { to: eventDetailBackPath(from), label: t('common.back') }
        }
        actions={
          member &&
          detail && (
            <>
              <EventHeart
                memberId={member.id}
                eventId={detail.eventId}
                saved={detail.subscribed}
                title={detail.title}
              />
              <ShareButton event={detail} />
            </>
          )
        }
      />
      <PageBody className={styles.detail}>
        {isEventId(eventId) ? (
          member && (
            <EventDetailContent
              key={`${member.id}:${eventId}`}
              memberId={member.id}
              eventId={eventId}
            />
          )
        ) : (
          <Muted>{t('events.notFound')}</Muted>
        )}
      </PageBody>
    </>
  )
}

/** Detail data for the header ♥ and share (shares the content's query). */
function useEventDetailIfValid(
  memberId: number | undefined,
  eventId: string | undefined,
) {
  const valid = memberId !== undefined && isEventId(eventId)
  const query = useEventDetail(memberId ?? 0, valid ? eventId : '', valid)
  return valid ? query.data : undefined
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

  const event = query.data
  return (
    <>
      <EventDetails event={event} />
      <EventAlerts event={event} memberId={memberId} saved={event.subscribed} />
      <MascotTip mascot="haero">{t('events.alerts.tip')}</MascotTip>
      <EventLinks event={event} memberId={memberId} />
      <EventBottomActions event={event} memberId={memberId} />
    </>
  )
}

function EventDetails({ event }: { event: EventDetail }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const machineTranslated = event.translated && event.language !== 'ko'
  const dates = formatEventDates(event, language)
  const times = formatEventTimes(event, language)
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
      <div className={styles.tags}>
        {event.categoryName && <Tag>{event.categoryName}</Tag>}
        {event.multicultural && (
          <Tag tone="main">{t('events.multicultural')}</Tag>
        )}
        {machineTranslated && (
          <Tag tone="main">{t('events.translationAutomatic')}</Tag>
        )}
        {!event.translated && (
          <Tag tone="warning">{t('events.translationPending')}</Tag>
        )}
      </div>
      <h2 className={styles.title} lang={event.language}>
        {event.title}
      </h2>
      <dl className={styles.facts}>
        <Fact icon={<CalendarIcon />} label={t('events.date')}>
          {dates ?? t('events.dateUnknown')}
          {(times || event.timeUnknown) && (
            <> · {times || t('events.timeUnknown')}</>
          )}
        </Fact>
        {event.venue && (
          <Fact
            icon={<MapPinIcon />}
            label={t('events.venue')}
            lang={event.language}
          >
            {event.venue}
          </Fact>
        )}
        {event.priceInfo && (
          <Fact icon={<TicketIcon />} label={t('events.price')}>
            {event.priceInfo}
          </Fact>
        )}
        {deadline && (
          <Fact icon={<ClockIcon />} label={t('events.deadline')}>
            {deadline}
          </Fact>
        )}
      </dl>
      {event.description && (
        <section className={styles.intro}>
          <h3>{t('events.intro')}</h3>
          <p lang={event.language}>{event.description}</p>
        </section>
      )}
    </>
  )
}

/** One fact row with its icon (Figma v2 M07c). The label stays for screen readers. */
function Fact({
  icon,
  label,
  lang,
  children,
}: {
  icon: ReactNode
  label: string
  lang?: string
  children: ReactNode
}) {
  return (
    <div>
      <dt>
        {icon}
        <span className="visually-hidden">{label}</span>
      </dt>
      <dd lang={lang}>{children}</dd>
    </div>
  )
}

/** Text links: 원문 보기 · 신청하기 · 정보 오류 신고 (Figma v2 M07c). */
function EventLinks({
  event,
  memberId,
}: {
  event: EventDetail
  memberId: number
}) {
  const { t } = useTranslation()
  const applicationUrl = eventLink(event.applicationUrl)
  const sourceUrl = eventLink(event.sourceUrl)
  return (
    <div className={styles.textLinks}>
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          {t('events.original')} ›
        </a>
      )}
      {applicationUrl && applicationUrl !== sourceUrl && (
        <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
          {t('events.apply')} ›
        </a>
      )}
      <EventReport event={event} memberId={memberId} />
    </div>
  )
}

/** Bottom: [질문하기][♥ 찜하고 달력에 담기] (Figma v2 M07c). */
function EventBottomActions({
  event,
  memberId,
}: {
  event: EventDetail
  memberId: number
}) {
  const { t } = useTranslation()
  const heart = useEventHeart(memberId, event.eventId, event.subscribed)
  return (
    <BottomArea>
      {heart.error && <FormError message={t('events.heart.saveError')} />}
      <div className={styles.bottomActions}>
        <ButtonLink
          variant="secondary"
          to="/chat"
          state={chatEntryState(
            { type: 'event', id: String(event.eventId) },
            t('events.askDraft', { title: event.title }),
          )}
        >
          {t('events.ask')}
        </ButtonLink>
        <Button
          aria-pressed={heart.liked}
          disabled={heart.pending}
          onClick={heart.toggle}
        >
          <HeartIcon filled={heart.liked} />{' '}
          {t(
            heart.liked ? 'events.heart.remove' : 'events.heart.saveToCalendar',
          )}
        </Button>
      </div>
    </BottomArea>
  )
}

function ShareButton({ event }: { event: EventDetail }) {
  const { t } = useTranslation()
  const url = new URL(`/events/${event.eventId}`, window.location.origin).href
  const [shareStatus, setShareStatus] =
    useState<Awaited<ReturnType<typeof shareEvent>>>()
  return (
    <>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={t('events.share')}
        onClick={async () =>
          setShareStatus(await shareEvent(event.title, url, navigator))
        }
      >
        <ShareIcon />
      </button>
      {shareStatus === 'copied' && (
        <div role="status" className={styles.toast}>
          {t('events.shareCopied')}
        </div>
      )}
      {shareStatus === 'manual' && (
        <div className={styles.toast}>
          <TextField
            label={t('events.shareManual')}
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </>
  )
}
