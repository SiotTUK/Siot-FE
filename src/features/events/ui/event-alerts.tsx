import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'
import { koreaToday } from '@/shared/i18n/format'
import { SelectField } from '@/shared/ui/field'
import { Muted } from '@/shared/ui/page'
import { eventLeadDays, type EventSummary } from '../api'
import { useEventSubscription } from '../use-event-subscription'
import styles from './event-alerts.module.css'

/**
 * Figma v2 M07c "찜하면 알림도 받아요". A saved event (♥ = subscription) gets
 * a reminder before it starts (1·3·7 days, the subscription's lead days) and
 * a notice when the collector finds a schedule change. v2's "신청 마감 전"
 * switch has no backend support, so it is not shown.
 */
export function EventAlerts({
  event,
  memberId,
  saved,
}: {
  event: EventSummary
  memberId: number
  saved: boolean
}) {
  const { t } = useTranslation()
  const { status, pending, error, save } = useEventSubscription(
    memberId,
    String(event.eventId),
  )
  const lastDay = event.endsOn ?? event.startsOn
  const ended = lastDay !== null && lastDay < koreaToday()
  const leadDays = status.data?.leadDays ?? 1

  return (
    <section
      className={styles.card}
      aria-labelledby={`alerts-${event.eventId}`}
    >
      <h3 id={`alerts-${event.eventId}`}>{t('events.alerts.title')}</h3>
      {ended ? (
        <Muted>{t('events.reminder.ended')}</Muted>
      ) : !saved ? (
        <Muted>{t('events.alerts.notSaved')}</Muted>
      ) : (
        <>
          <SelectField
            label={t('events.alerts.before')}
            value={leadDays}
            disabled={pending || status.isPending}
            options={eventLeadDays.map((day) => ({
              value: String(day),
              label: t(`events.reminder.day${day}`),
            }))}
            onChange={(e) => {
              const day = eventLeadDays.find(
                (value) => value === Number(e.target.value),
              )
              if (day) save(day, () => undefined)
            }}
          />
          <p className={styles.always}>
            <span aria-hidden="true">✓</span> {t('events.alerts.changes')}
          </p>
        </>
      )}
      {error && (
        <div role="alert" className={styles.error}>
          {t(
            error instanceof ApiError && error.code === 'EVENT_NOT_FOUND'
              ? 'events.notFound'
              : 'events.reminder.saveError',
          )}
        </div>
      )}
    </section>
  )
}
