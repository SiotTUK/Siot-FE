import type { Language } from '../api/types'
import { languages } from '../i18n'
import { ChevronDownIcon, TranslateIcon } from './icons'
import styles from './language-select.module.css'

/** `boxed` for headers, `field` for a full-width select in a form or card (M10). */
export function LanguageSelect({
  value,
  label,
  onChange,
  variant = 'boxed',
}: {
  value: Language
  label: string
  onChange: (language: Language) => void
  variant?: 'boxed' | 'field'
}) {
  return (
    <label className={`${styles.wrapper} ${styles[variant]}`}>
      <span className="visually-hidden">{label}</span>
      {variant === 'field' && <TranslateIcon className={styles.icon} />}
      <select
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value as Language)}
      >
        {Object.entries(languages).map(([code, name]) => (
          <option key={code} value={code} lang={code}>
            {name}
          </option>
        ))}
      </select>
      {variant === 'field' ? (
        <ChevronDownIcon className={styles.caret} />
      ) : (
        <span className={styles.caret} aria-hidden="true">
          ▼
        </span>
      )}
    </label>
  )
}
