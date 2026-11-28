import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button, ButtonLink } from '@/shared/ui/button'
import { SelectField, TextField } from '@/shared/ui/field'
import {
  Card,
  FormError,
  Muted,
  Notice,
  Section,
  Stack,
  Tag,
  Toolbar,
} from '@/shared/ui/page'
import { InfiniteList } from '@/shared/ui/query-state'
import {
  eventCategories,
  eventRegions,
  eventSources,
  eventStatuses,
  type AdminEventFilters,
  type AdminEventSummary,
} from '../event-api'
import { eventPeriod } from '../event-form'
import {
  useAdminEvents,
  useCollectEvents,
  useEventCollectionStatus,
} from '../use-admin-events'
import styles from './admin.module.css'

/** ADM-05: every event (deleted too), newest first, with filters. */
export function EventList() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<AdminEventFilters>({
    status: 'ACTIVE',
    region: '',
    source: '',
    category: '',
    title: '',
  })
  const title = useDeferredValue(filters.title)
  const events = useAdminEvents({ ...filters, title })
  const select = <K extends keyof AdminEventFilters>(
    key: K,
    label: string,
    values: readonly string[],
    labelKey: string,
  ) => (
    <SelectField
      label={label}
      value={filters[key]}
      onChange={(event) =>
        setFilters((current) => ({ ...current, [key]: event.target.value }))
      }
      options={[
        { value: '', label: t('admin.all') },
        ...values.map((value) => ({
          value,
          label: t(`${labelKey}.${value}`),
        })),
      ]}
    />
  )

  return (
    <>
      <ButtonLink to="/admin/events/new">{t('admin.events.create')}</ButtonLink>
      <CollectPanel />
      <Toolbar>
        {select(
          'status',
          t('admin.events.status'),
          eventStatuses,
          'admin.events.statuses',
        )}
        {select(
          'region',
          t('admin.events.region'),
          eventRegions,
          'admin.events.regions',
        )}
      </Toolbar>
      <Toolbar>
        {select(
          'source',
          t('admin.events.source'),
          eventSources,
          'admin.events.sources',
        )}
        {select(
          'category',
          t('admin.events.category'),
          eventCategories,
          'admin.events.categories',
        )}
      </Toolbar>
      <TextField
        type="search"
        label={t('admin.events.title')}
        placeholder={t('admin.events.titlePlaceholder')}
        value={filters.title}
        onChange={(event) =>
          setFilters((current) => ({ ...current, title: event.target.value }))
        }
      />
      <InfiniteList
        query={events}
        empty={t('admin.empty')}
        getKey={(event) => event.eventId}
        renderItem={(event) => <EventRow event={event} />}
      />
    </>
  )
}

function EventRow({ event }: { event: AdminEventSummary }) {
  const { t } = useTranslation()
  return (
    <Link className="plain-link" to={`/admin/events/${event.eventId}`}>
      <Card>
        <strong>{event.title}</strong>
        <Muted>
          {eventPeriod(event.startsOn, event.endsOn)} ·{' '}
          {event.region ? t(`admin.events.regions.${event.region}`) : '-'}
        </Muted>
        <p className={styles.tags}>
          {event.status === 'DELETED' && (
            <Tag tone="danger">{t('admin.events.statuses.DELETED')}</Tag>
          )}
          <Tag tone={event.source === 'MANUAL' ? 'main' : 'neutral'}>
            {t(`admin.events.sources.${event.source}`)}
          </Tag>
          <Tag>{t(`admin.events.categories.${event.category}`)}</Tag>
          {event.multicultural && (
            <Tag>{t('admin.events.multiculturalTag')}</Tag>
          )}
        </p>
        <Muted>
          #{event.eventId} ·{' '}
          {t('admin.updatedAt', {
            date: formatDateTime(event.updatedAt, currentLanguage()),
          })}
        </Muted>
      </Card>
    </Link>
  )
}

/** ADM-05 run the daily collection now; EVE-10 last successful collection. */
function CollectPanel() {
  const { t } = useTranslation()
  const language = currentLanguage()
  const status = useEventCollectionStatus()
  const collect = useCollectEvents()
  const last = status.data?.lastUpdatedAt
  return (
    <Section title={t('admin.events.collectTitle')}>
      <Stack gap={10}>
        <Muted>
          {status.isPending
            ? t('common.loading')
            : last
              ? t('admin.events.lastCollected', {
                  date: formatDateTime(last, language),
                })
              : t('admin.events.neverCollected')}
        </Muted>
        <Button
          variant="secondary"
          loading={collect.isPending}
          onClick={() => collect.mutate()}
        >
          {t('admin.events.collect')}
        </Button>
        {collect.isPending && <Muted>{t('admin.events.collecting')}</Muted>}
        <FormError
          message={collect.isError ? errorMessage(t, collect.error) : undefined}
        />
        {collect.data && (
          <Notice tone="success" title={t('admin.events.collectDone')}>
            <ul className={styles.runs}>
              {collect.data.map((run) => (
                <li key={run.runId}>
                  {t(`admin.events.sources.${run.source}`)} ·{' '}
                  {t(`admin.events.runStatuses.${run.status}`)} ·{' '}
                  {t('admin.events.runCounts', {
                    fetched: run.fetchedCount,
                    upserted: run.upsertedCount,
                  })}
                  {run.error && ` · ${run.error}`}
                </li>
              ))}
            </ul>
            <Muted>{t('admin.events.translatingLater')}</Muted>
          </Notice>
        )}
      </Stack>
    </Section>
  )
}
