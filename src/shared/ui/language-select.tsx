import type { Language } from '../api/types'
import { languages } from '../i18n'
import { ChevronDownIcon, GlobeIcon, TranslateIcon } from './icons'
import styles from './language-select.module.css'

/**
 * `inline` for the top bar (globe + language name, Figma M/TopBar),
 * `boxed` for screen headers, `field` for a full-width select in a card (M10).
 * Always a native <select>, so the list and keyboard work everywhere.
 */
export function LanguageSelect({
  value,
  label,
  onChange,
  variant = 'boxed',
}: {
  value: Language
  label: string
  onChange: (language: Language) => void
  variant?: 'inline' | 'boxed' | 'field'
}) {
  return (
    <label className={`${styles.wrapper} ${styles[variant]}`}>
      <span className="visually-hidden">{label}</span>
      {variant === 'field' && <TranslateIcon className={styles.icon} />}
      {variant === 'inline' && <GlobeIcon className={styles.icon} />}
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
      {variant === 'field' && <ChevronDownIcon className={styles.caret} />}
      {variant === 'boxed' && (
        <span className={styles.caret} aria-hidden="true">
          ▼
        </span>
      )}
    </label>
  )
}
