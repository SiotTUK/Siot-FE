import { useTranslation } from 'react-i18next'
import { ChevronDownIcon } from '@/shared/ui/icons'
import { eventSorts, type EventSort, type EventStatus } from '../event-filters'
import styles from './event-sort-select.module.css'

/**
 * Figma v2 M12 "시작일순 ▾" beside the list title: the BE sorts (BE #17).
 * Native <select> so the list and keyboard work everywhere. Where only the
 * DATE order works (scheduled events) it is shown disabled.
 */
export function EventSortSelect({
  value,
  status,
  available,
  onChange,
}: {
  value: EventSort
  status: EventStatus
  available: boolean
  onChange: (sort: EventSort) => void
}) {
  const { t } = useTranslation()
  const label = (sort: EventSort) =>
    t(
      `events.sort.${sort === 'DATE' && status === 'ended' ? 'DATE_ENDED' : sort}`,
    )

  return (
    <label className={styles.wrapper}>
      <span className="visually-hidden">{t('events.sort.label')}</span>
      <select
        className={styles.select}
        value={available ? value : 'DATE'}
        disabled={!available}
        title={available ? undefined : t('events.sort.dateOnly')}
        onChange={(event) => {
          const next = eventSorts.find((sort) => sort === event.target.value)
          if (next) onChange(next)
        }}
      >
        {eventSorts.map((sort) => (
          <option key={sort} value={sort}>
            {label(sort)}
          </option>
        ))}
      </select>
      <ChevronDownIcon className={styles.caret} aria-hidden="true" />
      {!available && (
        <span className="visually-hidden">{t('events.sort.dateOnly')}</span>
      )}
    </label>
  )
}
