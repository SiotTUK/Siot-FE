import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import type { ScheduleResponse } from '@/features/calendar/api'
import {
  getWeekScheduleLines,
  isScheduledOn,
  scheduleKey,
} from '@/features/calendar/calendar'
import { useMonthlySchedules } from '@/features/calendar/use-monthly-schedules'
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
  const [monthStart, setMonthStart] = useState(
    () => new Date(`${today.slice(0, 7)}-01T00:00:00Z`),
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const groupName = useId()
  const year = monthStart.getUTCFullYear()
  const month = monthStart.getUTCMonth() + 1
  const query = useMonthlySchedules(memberId, year, month, language)
  const monthPrefix = monthStart.toISOString().slice(0, 7)
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
  const schedules = query.data ?? []
  const visibleSchedules = selectedDate
    ? schedules.filter((schedule) => isScheduledOn(schedule, selectedDate))
    : schedules

  function moveMonth(offset: number) {
    setMonthStart((previous) => {
      const next = new Date(previous)
      next.setUTCMonth(next.getUTCMonth() + offset)
      return next
    })
    setSelectedDate(null)
  }

  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('nav.calendar')} />
      <section className={styles.month} aria-label={monthLabel}>
        <div className={styles.monthNavigation}>
          <Button
            variant="secondary"
            aria-label={t('calendar.previousMonth')}
            onClick={() => moveMonth(-1)}
          >
            <ChevronRightIcon className={styles.previousIcon} />
          </Button>
          <h2 aria-live="polite">{monthLabel}</h2>
          <Button
            variant="secondary"
            aria-label={t('calendar.nextMonth')}
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
              onChange={() => setSelectedDate(null)}
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
            const { lines, laneCount } = getWeekScheduleLines(dates, schedules)
            return (
              <div
                className={styles.week}
                key={dates[0]}
                style={
                  laneCount
                    ? { gridTemplateRows: `38px repeat(${laneCount}, 7px)` }
                    : undefined
                }
              >
                {dates.map((date, index) => {
                  const count = lines.filter(
                    ({ firstDay, lastDay }) =>
                      firstDay <= index && index <= lastDay,
                  ).length
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
                          count
                            ? t('calendar.dateWithSchedules', {
                                date: dateLabel,
                                count,
                              })
                            : dateLabel
                        }
                        aria-current={date === today ? 'date' : undefined}
                        checked={selectedDate === date}
                        onChange={() => setSelectedDate(date)}
                      />
                      <span data-today={date === today}>
                        {dayNumber.format(Number(date.slice(-2)))}
                      </span>
                    </label>
                  )
                })}
                {lines.map(({ schedule, firstDay, lastDay, lane }) => (
                  <span
                    aria-hidden="true"
                    className={styles.scheduleLine}
                    data-kind={schedule.kind}
                    data-start={dates[firstDay] === schedule.startsOn}
                    data-end={
                      dates[lastDay] === (schedule.endsOn ?? schedule.startsOn)
                    }
                    key={scheduleKey(schedule)}
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
        {query.isPending ? (
          <div role="status">
            <Muted>{t('common.loading')}</Muted>
          </div>
        ) : query.isError ? (
          <>
            <FormError message={t('calendar.error')} />
            <Button
              variant="secondary"
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t('common.retry')}
            </Button>
          </>
        ) : visibleSchedules.length === 0 ? (
          <Muted>
            {t(selectedDate ? 'calendar.emptyDay' : 'calendar.emptyMonth')}
          </Muted>
        ) : (
          <ul className={styles.schedules}>
            {visibleSchedules.map((schedule) => (
              <ScheduleItem key={scheduleKey(schedule)} schedule={schedule} />
            ))}
          </ul>
        )}
      </Section>
    </PageBody>
  )
}

function ScheduleItem({ schedule }: { schedule: ScheduleResponse }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const start = formatCalendarDate(schedule.startsOn, language)
  const end = schedule.endsOn && formatCalendarDate(schedule.endsOn, language)

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
      <Muted>
        {end && end !== start ? t('calendar.period', { start, end }) : start}
      </Muted>
      {schedule.targetDescription && (
        <Muted>{schedule.targetDescription}</Muted>
      )}
    </li>
  )
}
