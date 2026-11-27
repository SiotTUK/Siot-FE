import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { ChipGroup } from '@/shared/ui/chip-group'
import { TextField } from '@/shared/ui/field'
import {
  defaultEventFilters,
  eventCategories,
  hasEventFilters,
  isDateRangeValid,
  isIsoDate,
  type EventListFilters as Filters,
} from '../event-filters'
import styles from './event-list-filters.module.css'

/**
 * EVE-10 list filter area: event status, category and a date range.
 * The region filter (#33) joins this area and its reset.
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
          { value: 'ongoing', label: t('events.filters.ongoing') },
          { value: 'scheduled', label: t('events.filters.scheduled') },
          { value: 'ended', label: t('events.filters.ended') },
        ]}
        value={filters.status}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <ChipGroup
        label={t('events.filters.category')}
        variant="pill"
        options={[
          { value: 'ALL', label: t('events.filters.allCategories') },
          ...eventCategories.map((category) => ({
            value: category,
            label: t(`events.categories.${category}`),
          })),
        ]}
        value={filters.category ?? 'ALL'}
        onChange={(category) =>
          onChange({
            ...filters,
            category: category === 'ALL' ? null : category,
          })
        }
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
