import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import type { ScheduleResponse } from '@/features/calendar/api'
import {
  calendarEntries,
  getCalendarWeek,
  isScheduledOn,
} from '@/features/calendar/calendar'
import {
  calendarSearch,
  firstCalendarMonth,
  lastCalendarMonth,
  readCalendarLocation,
} from '@/features/calendar/calendar-location'
import { useMonthlySchedules } from '@/features/calendar/use-monthly-schedules'
import { useEventCalendar } from '@/features/events/use-events'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate, koreaToday } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ChevronRightIcon } from '@/shared/ui/icons'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, Muted, PageHeading, Section, Tag } from '@/shared/ui/page'
import styles from './calendar-page.module.css'

export function CalendarPage() {
  const { data: member } = useMe()
  const today = koreaToday()

  return (
    member && (
      <MonthlyCalendar
        key={`${member.id}:${today.slice(0, 7)}`}
        memberId={member.id}
        today={today}
      />
    )
  )
}

function MonthlyCalendar({
  memberId,
  today,
}: {
  memberId: number
  today: string
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const [params, setParams] = useSearchParams()
  const { month: monthPrefix, date: selectedDate } = readCalendarLocation(
    params,
    today,
  )
  const groupName = useId()
  const monthStart = new Date(`${monthPrefix}-01T00:00:00Z`)
  const year = monthStart.getUTCFullYear()
  const month = monthStart.getUTCMonth() + 1
  const schedulesQuery = useMonthlySchedules(memberId, year, month, language)
  const eventsQuery = useEventCalendar(memberId, year, month)
  const firstWeekday = monthStart.getUTCDay()
  const numberOfDays = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const monthLabel = new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(monthStart)
  const weekday = new Intl.DateTimeFormat(language, {
    weekday: 'short',
    timeZone: 'UTC',
  })
  const dayNumber = new Intl.NumberFormat(language)
  const dates = Array.from(
    { length: numberOfDays },
    (_, index) => `${monthPrefix}-${String(index + 1).padStart(2, '0')}`,
  )
  const weeks = Array.from(
    { length: Math.ceil((firstWeekday + numberOfDays) / 7) },
    (_, index) => ({
      dates: dates.slice(
        Math.max(0, index * 7 - firstWeekday),
        (index + 1) * 7 - firstWeekday,
      ),
      firstColumn: index === 0 ? firstWeekday + 1 : 1,
    }),
  )
  const { scheduleEntries, eventEntries, all } = calendarEntries(
    schedulesQuery.data ?? [],
    eventsQuery.data ?? [],
  )
  const visibleEntries = selectedDate
    ? all.filter((entry) => isScheduledOn(entry, selectedDate))
    : all
  const sources = [
    {
      query: schedulesQuery,
      key: 'schedules',
      error: 'calendar.scheduleError',
    },
    { query: eventsQuery, key: 'events', error: 'calendar.eventError' },
  ] as const

  function selectDate(date: string | null) {
    setParams(calendarSearch(monthPrefix, date), {
      replace: true,
      preventScrollReset: true,
    })
  }

  function moveMonth(offset: number) {
    const next = new Date(monthStart)
    next.setUTCMonth(next.getUTCMonth() + offset)
    setParams(calendarSearch(next.toISOString().slice(0, 7), null), {
      replace: true,
      preventScrollReset: true,
    })
  }

  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('nav.calendar')} />
      <section className={styles.month} aria-label={monthLabel}>
        <div className={styles.monthNavigation}>
          <Button
            variant="secondary"
            aria-label={t('calendar.previousMonth')}
            disabled={monthPrefix === firstCalendarMonth}
            onClick={() => moveMonth(-1)}
          >
            <ChevronRightIcon className={styles.previousIcon} />
          </Button>
          <h2 aria-live="polite">{monthLabel}</h2>
          <Button
            variant="secondary"
            aria-label={t('calendar.nextMonth')}
            disabled={monthPrefix === lastCalendarMonth}
            onClick={() => moveMonth(1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <fieldset className={styles.filter}>
          <legend className="visually-hidden">{t('calendar.filter')}</legend>
          <label className={styles.all}>
            <input
              className="visually-hidden"
              type="radio"
              name={groupName}
              checked={selectedDate === null}
              onChange={() => selectDate(null)}
            />
            <span>{t('calendar.all')}</span>
          </label>
          <div className={styles.weekdays}>
            {Array.from({ length: 7 }, (_, index) => (
              <span className={styles.weekday} aria-hidden="true" key={index}>
                {weekday.format(
                  new Date(Date.UTC(year, month - 1, 1 - firstWeekday + index)),
                )}
              </span>
            ))}
          </div>
          {weeks.map(({ dates, firstColumn }) => {
            const { lines, laneCount, days } = getCalendarWeek(
              dates,
              scheduleEntries,
              eventEntries,
            )
            const overflowRow = days.some(({ hidden }) => hidden > 0)
            return (
              <div
                className={styles.week}
                key={dates[0]}
                style={
                  laneCount
                    ? {
                        gridTemplateRows: `38px repeat(${laneCount}, 7px)${overflowRow ? ' 18px' : ''}`,
                      }
                    : undefined
                }
              >
                {dates.map((date, index) => {
                  const { scheduleCount, eventCount, hidden } = days[index]
                  const dateLabel = formatCalendarDate(date, language)
                  return (
                    <label
                      className={styles.day}
                      key={date}
                      style={{ gridColumnStart: firstColumn + index }}
                    >
                      <input
                        className="visually-hidden"
                        type="radio"
                        name={groupName}
                        aria-label={
                          scheduleCount || eventCount
                            ? t('calendar.dateWithEntries', {
                                date: dateLabel,
                                schedules: dayNumber.format(scheduleCount),
                                events: dayNumber.format(eventCount),
                              })
                            : dateLabel
                        }
                        aria-current={date === today ? 'date' : undefined}
                        checked={selectedDate === date}
                        onChange={() => selectDate(date)}
                      />
                      <span data-today={date === today}>
                        {dayNumber.format(Number(date.slice(-2)))}
                      </span>
                      {hidden > 0 && (
                        <span className={styles.overflow} aria-hidden="true">
                          +{dayNumber.format(hidden)}
                        </span>
                      )}
                    </label>
                  )
                })}
                {lines.map(({ schedule, firstDay, lastDay, lane }) => (
                  <span
                    aria-hidden="true"
                    className={styles.scheduleLine}
                    data-kind={
                      schedule.source === 'event'
                        ? 'EVENT'
                        : schedule.schedule.kind
                    }
                    data-start={dates[firstDay] === schedule.startsOn}
                    data-end={
                      dates[lastDay] === (schedule.endsOn ?? schedule.startsOn)
                    }
                    key={schedule.key}
                    style={{
                      gridColumn: `${firstColumn + firstDay} / ${firstColumn + lastDay + 1}`,
                      gridRow: lane + 2,
                    }}
                  />
                ))}
              </div>
            )
          })}
        </fieldset>
      </section>
      <Section
        title={
          selectedDate
            ? formatCalendarDate(selectedDate, language)
            : t('calendar.all')
        }
      >
        {sources.map(({ query, key, error }) =>
          query.isError ? (
            <div className={styles.sourceStatus} key={key}>
              <FormError message={t(error)} />
              <Button
                variant="secondary"
                aria-label={t(`calendar.retry_${key}`)}
                loading={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : null,
        )}
        {sources.some(({ query }) => query.isPending) && (
          <div role="status">
            <Muted>{t('common.loading')}</Muted>
          </div>
        )}
        {visibleEntries.length > 0 ? (
          <ul className={styles.schedules}>
            {visibleEntries.map((entry) =>
              entry.source === 'schedule' ? (
                <ScheduleItem key={entry.key} schedule={entry.schedule} />
              ) : (
                <li key={entry.key}>
                  <Link
                    className={`${styles.schedule} ${styles.event}`}
                    to={`/events/${entry.event.eventId}`}
                    state={{ from: 'calendar' }}
                  >
                    <Tag tone="warning">{t('events.detail')}</Tag>
                    <strong lang={entry.event.translated ? undefined : 'ko'}>
                      {entry.event.title}
                    </strong>
                    <CalendarPeriod
                      startsOn={entry.startsOn}
                      endsOn={entry.endsOn}
                    />
                    {!entry.event.translated && (
                      <Muted>{t('events.translationPending')}</Muted>
                    )}
                  </Link>
                </li>
              ),
            )}
          </ul>
        ) : sources.every(({ query }) => query.isSuccess) ? (
          <Muted>
            {t(selectedDate ? 'calendar.emptyDay' : 'calendar.emptyMonth')}
          </Muted>
        ) : null}
      </Section>
    </PageBody>
  )
}

function ScheduleItem({ schedule }: { schedule: ScheduleResponse }) {
  const { t } = useTranslation()
  return (
    <li className={styles.schedule} data-highlighted={schedule.highlighted}>
      {(schedule.personal || schedule.highlighted) && (
        <div className={styles.tags}>
          {schedule.personal && <Tag tone="main">{t('calendar.personal')}</Tag>}
          {schedule.highlighted && (
            <Tag tone="warning">{t('calendar.highlighted')}</Tag>
          )}
        </div>
      )}
      <strong>{schedule.title}</strong>
      <CalendarPeriod startsOn={schedule.startsOn} endsOn={schedule.endsOn} />
      {schedule.targetDescription && (
        <Muted>{schedule.targetDescription}</Muted>
      )}
    </li>
  )
}

function CalendarPeriod({
  startsOn,
  endsOn,
}: Pick<ScheduleResponse, 'startsOn' | 'endsOn'>) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const start = formatCalendarDate(startsOn, language)
  const end = endsOn && formatCalendarDate(endsOn, language)

  return (
    <Muted>
      {end && end !== start ? t('calendar.period', { start, end }) : start}
    </Muted>
  )
}
