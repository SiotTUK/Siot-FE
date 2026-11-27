import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'
import { koreaToday } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { SelectField } from '@/shared/ui/field'
import { Muted } from '@/shared/ui/page'
import { eventLeadDays, type EventLeadDays, type EventSummary } from '../api'
import { useEventSubscription } from '../use-event-subscription'
import styles from './event-subscription.module.css'

export function EventSubscription({
  event,
  memberId,
  initiallySubscribed = false,
  alignActionsEnd = false,
}: {
  event: EventSummary
  memberId: number
  initiallySubscribed?: boolean
  alignActionsEnd?: boolean
}) {
  const { t } = useTranslation()
  const { status, pending, error, save } = useEventSubscription(
    memberId,
    String(event.eventId),
  )
  const [choice, setChoice] = useState<EventLeadDays>()
  const subscribed = status.data?.subscribed ?? initiallySubscribed
  const leadDays = choice ?? status.data?.leadDays ?? 1
  const lastDay = event.endsOn ?? event.startsOn
  const ended = lastDay !== null && lastDay < koreaToday()

  return (
    <section className={styles.panel} aria-label={t('events.reminder.title')}>
      <strong>{t('events.reminder.title')}</strong>
      {status.isPending ? (
        <div role="status">{t('common.loading')}</div>
      ) : status.isError && !status.data ? (
        <>
          <div role="alert">{t('events.reminder.loadError')}</div>
          <Button variant="secondary" onClick={() => void status.refetch()}>
            {t('common.retry')}
          </Button>
        </>
      ) : (
        <>
          {ended ? (
            <Muted>{t('events.reminder.ended')}</Muted>
          ) : (
            <SelectField
              label={t('events.reminder.timing')}
              hideLabel
              value={leadDays}
              disabled={pending}
              options={eventLeadDays.map((day) => ({
                value: String(day),
                label: t(`events.reminder.day${day}`),
              }))}
              onChange={(e) =>
                setChoice(
                  eventLeadDays.find((day) => day === Number(e.target.value)),
                )
              }
            />
          )}
          {pending && (
            <div role="status" className="visually-hidden">
              {t('common.loading')}
            </div>
          )}
          {error && (
            <div role="alert">
              {t(
                error instanceof ApiError && error.code === 'EVENT_NOT_FOUND'
                  ? 'events.notFound'
                  : 'events.reminder.saveError',
              )}
            </div>
          )}
          <div
            className={styles.actions}
            data-align-end={alignActionsEnd || undefined}
          >
            {!ended && (
              <Button
                variant="secondary"
                disabled={
                  pending || (subscribed && leadDays === status.data?.leadDays)
                }
                onClick={() => save(leadDays, () => setChoice(undefined))}
              >
                {t(
                  subscribed ? 'events.reminder.save' : 'events.reminder.title',
                )}
              </Button>
            )}
            {subscribed && (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => save(null, () => setChoice(undefined))}
              >
                {t('events.reminder.remove')}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
