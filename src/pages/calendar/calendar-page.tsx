import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import type { ScheduleResponse } from '@/features/calendar/api'
import {
  calendarEntries,
  dDayLabel,
  getCalendarWeek,
  httpUrl,
  isScheduledOn,
} from '@/features/calendar/calendar'
import {
  calendarSearch,
  firstCalendarMonth,
  lastCalendarMonth,
  readCalendarLocation,
} from '@/features/calendar/calendar-location'
import { scheduleDetailPath, taxDetailPath } from '@/features/calendar/taxes'
import { useNextSchedule } from '@/features/calendar/use-next-schedule'
import { useMonthlySchedules } from '@/features/calendar/use-monthly-schedules'
import {
  useEventCalendar,
  useSavedEventIds,
} from '@/features/events/use-events'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate, koreaToday } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ChipGroup } from '@/shared/ui/chip-group'
import { ChevronRightIcon, HeartIcon } from '@/shared/ui/icons'
import { MascotTip } from '@/shared/ui/mascot-tip'
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
  // Figma v2: the calendar holds saved (♥) events only; chips pick the kind.
  const saved = useSavedEventIds(memberId)
  const [kind, setKind] = useState<'all' | 'todo' | 'saved'>('all')
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
    kind === 'saved' ? [] : (schedulesQuery.data ?? []),
    kind === 'todo'
      ? []
      : (eventsQuery.data ?? []).filter((event) => saved.has(event.eventId)),
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
  const loaded = sources.every(({ query }) => query.isSuccess)
  const emptyMonth = loaded && !selectedDate && all.length === 0
  // #34: an empty month shows the next schedule ("다음 할 일 · 12월"). Saved
  // events alone have no next schedule to show.
  const next = useNextSchedule(
    memberId,
    monthPrefix,
    language,
    emptyMonth && kind !== 'saved',
  )

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
      <div className={styles.titleRow}>
        <PageHeading title={t('nav.calendar')} />
        <div className={styles.monthNavigation}>
          <button
            type="button"
            aria-label={t('calendar.previousMonth')}
            disabled={monthPrefix === firstCalendarMonth}
            onClick={() => moveMonth(-1)}
          >
            <ChevronRightIcon className={styles.previousIcon} />
          </button>
          <h2 aria-live="polite">{monthLabel}</h2>
          <button
            type="button"
            aria-label={t('calendar.nextMonth')}
            disabled={monthPrefix === lastCalendarMonth}
            onClick={() => moveMonth(1)}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <ChipGroup
        variant="pill"
        label={t('calendar.kinds')}
        value={kind}
        onChange={setKind}
        options={[
          { value: 'all', label: t('calendar.kindAll') },
          { value: 'todo', label: t('calendar.kindTodo') },
          { value: 'saved', label: t('calendar.kindSaved') },
        ]}
      />
      <section className={styles.month} aria-label={monthLabel}>
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
            : t('calendar.monthCount', {
                month: new Intl.DateTimeFormat(language, {
                  month: 'long',
                  timeZone: 'UTC',
                }).format(monthStart),
                count: visibleEntries.length,
              })
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
                <ScheduleItem
                  key={entry.key}
                  schedule={entry.schedule}
                  day={entryDay(entry.startsOn, selectedDate, monthPrefix)}
                />
              ) : (
                <li key={entry.key}>
                  <Link
                    className={`${styles.schedule} ${styles.event}`}
                    to={`/events/${entry.event.eventId}`}
                    state={{ from: 'calendar' }}
                  >
                    <DayBlock
                      date={entryDay(entry.startsOn, selectedDate, monthPrefix)}
                    />
                    <div className={styles.scheduleText}>
                      <strong lang={entry.event.translated ? undefined : 'ko'}>
                        <HeartIcon filled className={styles.heart} />{' '}
                        {entry.event.title}
                      </strong>
                      <CalendarPeriod
                        startsOn={entry.startsOn}
                        endsOn={entry.endsOn}
                      />
                      {!entry.event.translated && (
                        <Muted>{t('events.translationPending')}</Muted>
                      )}
                    </div>
                    <Tag>{t('calendar.savedBadge')}</Tag>
                  </Link>
                </li>
              ),
            )}
          </ul>
        ) : emptyMonth || (selectedDate && loaded) ? (
          <Muted>
            {t(selectedDate ? 'calendar.emptyDay' : 'calendar.emptyMonth')}
          </Muted>
        ) : null}
      </Section>
      {emptyMonth && next && (
        <Section
          title={t('calendar.nextTodo', {
            month: new Intl.DateTimeFormat(language, {
              month: 'long',
              timeZone: 'UTC',
            }).format(new Date(`${next.startsOn}T00:00:00Z`)),
          })}
        >
          <ul className={styles.schedules}>
            <ScheduleItem schedule={next} day={next.startsOn} />
          </ul>
        </Section>
      )}
      <MascotTip mascot="haero">{t('calendar.tip')}</MascotTip>
    </PageBody>
  )
}

/** The day shown at the left of a row: the picked date, else the start date in this month. */
function entryDay(startsOn: string, selected: string | null, month: string) {
  if (selected) return selected
  return startsOn.startsWith(month) ? startsOn : `${month}-01`
}

/** Day number and weekday at the left of a list row (Figma v2 M05). */
function DayBlock({ date }: { date: string }) {
  const language = currentLanguage()
  const value = new Date(`${date}T00:00:00Z`)
  return (
    <span className={styles.dayBlock} aria-hidden="true">
      <strong>{value.getUTCDate()}</strong>
      <small>
        {new Intl.DateTimeFormat(language, {
          weekday: 'short',
          timeZone: 'UTC',
        }).format(value)}
      </small>
    </span>
  )
}

function ScheduleItem({
  schedule,
  day,
}: {
  schedule: ScheduleResponse
  day: string
}) {
  const { t } = useTranslation()
  // Past schedules keep their dates only; a "기한 지남" chip on every old row is noise.
  const dDay =
    schedule.dDay != null && schedule.dDay >= 0
      ? dDayLabel(t, schedule.dDay)
      : null
  // BE #29: personal TAX_CAR·TAX_PROPERTY have no scheduleId, so the tax
  // detail opens by taxScheduleId. Other common schedules open the schedule
  // detail (#34); personal ones (stay expiry) have none.
  const detail =
    schedule.taxScheduleId != null
      ? {
          to: taxDetailPath(schedule.taxScheduleId),
          label: 'calendar.tax.open',
        }
      : schedule.scheduleId != null
        ? {
            to: scheduleDetailPath(schedule.scheduleId),
            label: 'calendar.schedule.open',
          }
        : null
  // The detail screen links the official page itself.
  const source = detail ? null : httpUrl(schedule.sourceUrl)
  return (
    <li className={styles.schedule} data-highlighted={schedule.highlighted}>
      <DayBlock date={day} />
      <div className={styles.scheduleText}>
        <strong>{schedule.title}</strong>
        <CalendarPeriod startsOn={schedule.startsOn} endsOn={schedule.endsOn} />
        {schedule.targetDescription && (
          <Muted>{schedule.targetDescription}</Muted>
        )}
        {detail && (
          <Link className={styles.taxLink} to={detail.to}>
            {t(detail.label)} ›
          </Link>
        )}
        {source && (
          <a
            className={styles.taxLink}
            href={source}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('calendar.sourceLink')} ↗
          </a>
        )}
      </div>
      {(dDay || schedule.highlighted || schedule.personal) && (
        <div className={styles.badges}>
          {dDay && <Tag tone="warning">{dDay}</Tag>}
          {(schedule.highlighted || schedule.personal) && (
            <Tag tone={schedule.highlighted ? 'warning' : 'main'}>
              {t(
                schedule.highlighted
                  ? 'calendar.highlighted'
                  : 'calendar.personal',
              )}
            </Tag>
          )}
        </div>
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
