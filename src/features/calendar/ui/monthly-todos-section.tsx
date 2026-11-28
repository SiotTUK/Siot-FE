import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate, formatYearMonth } from '@/shared/i18n/format'
import { Muted, Section, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { TextLink } from '@/shared/ui/text-link'
import type { MonthlyTodoItemResponse } from '../api'
import { dDayLabel, httpUrl, scheduleKey } from '../calendar'
import { todoMonthIso } from '../monthly-todos'
import { scheduleDetailLink } from '../taxes'
import { useMonthlyTodos } from '../use-monthly-todos'
import styles from './monthly-todos-section.module.css'

/**
 * CAL-02 home monthly to-dos: shows remaining schedules of this month (dDay >= 0,
 * including today's D-0) or falls back to next month when the server sets
 * `nextMonth: true`.
 */
export function MonthlyTodosSection({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const todos = useMonthlyTodos(memberId, language)
  const monthLabel = todos.data
    ? formatYearMonth(todoMonthIso(todos.data.year, todos.data.month), language)
    : undefined

  return (
    <Section
      title={
        monthLabel
          ? t('home.monthlyTodosWithMonth', { month: monthLabel })
          : t('home.monthlyTodosTitle')
      }
      action={<TextLink to="/calendar">{t('home.viewCalendar')} ›</TextLink>}
    >
      <QueryState query={todos}>
        {todos.data && (
          <>
            {todos.data.nextMonth && todos.data.items.length > 0 && (
              <p className={styles.notice} role="status">
                {t('home.monthlyTodosNextMonth', { month: monthLabel })}
              </p>
            )}
            {todos.data.items.length === 0 ? (
              <div className={styles.empty}>
                <Muted>{t('home.monthlyTodosEmpty')}</Muted>
              </div>
            ) : (
              <div className={styles.list}>
                <ul>
                  {todos.data.items.map((item) => (
                    <MonthlyTodoRow
                      key={scheduleKey(item.schedule)}
                      item={item}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </QueryState>
    </Section>
  )
}

function MonthlyTodoRow({ item }: { item: MonthlyTodoItemResponse }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const { schedule, dDay } = item
  const start = formatCalendarDate(schedule.startsOn, language)
  const end = schedule.endsOn && formatCalendarDate(schedule.endsOn, language)
  const period =
    end && end !== start ? t('calendar.period', { start, end }) : start
  const badge = dDayLabel(t, dDay)
  const detail = scheduleDetailLink(schedule)
  const source = detail ? null : httpUrl(schedule.sourceUrl)

  return (
    <li className={styles.row} data-highlighted={schedule.highlighted}>
      <div className={styles.text}>
        <strong className={styles.title}>{schedule.title}</strong>
        <Muted>{period}</Muted>
        {schedule.targetDescription && (
          <Muted>{schedule.targetDescription}</Muted>
        )}
        {detail && (
          <Link className={styles.link} to={detail.to}>
            {t(detail.label)} ›
          </Link>
        )}
        {source && (
          <a
            className={styles.link}
            href={source}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('calendar.sourceLink')} ↗
          </a>
        )}
      </div>
      <div className={styles.badges}>
        {badge && (
          <Tag tone={dDay <= 7 || schedule.highlighted ? 'warning' : 'main'}>
            {badge}
          </Tag>
        )}
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
    </li>
  )
}
