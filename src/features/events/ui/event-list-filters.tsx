import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { ChipGroup } from '@/shared/ui/chip-group'
import { TextField } from '@/shared/ui/field'
import {
  defaultEventFilters,
  hasEventFilters,
  isDateRangeValid,
  isIsoDate,
  type EventListFilters as Filters,
} from '../event-filters'
import styles from './event-list-filters.module.css'

/**
 * EVE-10 list filter area: upcoming/past switch and a date range.
 * Region (#33) and category (#37) filters join this area and its reset.
 */
export function EventListFilters({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
}) {
  const { t } = useTranslation()
  const rangeValid = isDateRangeValid(filters)
  const dateValue = (value: string) => (isIsoDate(value) ? value : null)

  return (
    <div className={styles.filters}>
      <ChipGroup
        label={t('events.filters.status')}
        options={[
          { value: 'upcoming', label: t('events.filters.upcoming') },
          { value: 'past', label: t('events.filters.past') },
        ]}
        value={filters.past ? 'past' : 'upcoming'}
        onChange={(value) => onChange({ ...filters, past: value === 'past' })}
      />
      <fieldset className={styles.period}>
        <legend className="visually-hidden">
          {t('events.filters.period')}
        </legend>
        <TextField
          label={t('events.filters.from')}
          type="date"
          value={filters.from ?? ''}
          max={filters.to ?? undefined}
          onChange={(event) =>
            onChange({ ...filters, from: dateValue(event.target.value) })
          }
        />
        <TextField
          label={t('events.filters.to')}
          type="date"
          value={filters.to ?? ''}
          min={filters.from ?? undefined}
          onChange={(event) =>
            onChange({ ...filters, to: dateValue(event.target.value) })
          }
          error={rangeValid ? undefined : t('events.filters.invalidRange')}
        />
      </fieldset>
      {hasEventFilters(filters) && (
        <Button
          variant="secondary"
          className={styles.reset}
          onClick={() => onChange(defaultEventFilters)}
        >
          {t('events.filters.reset')}
        </Button>
      )}
    </div>
  )
}
