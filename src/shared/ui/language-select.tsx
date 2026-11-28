import type { Language } from '../api/types'
import { languages } from '../i18n'
import { ChevronDownIcon, GlobeIcon, TranslateIcon } from './icons'
import styles from './language-select.module.css'

/**
 * `inline` for the top bar (globe + language name, Figma M/TopBar),
 * `boxed` for screen headers, `field` for a full-width select in a card (M10),
 * `pill` for a small rounded chip (chat M08a "한국어로 답해요 ▾").
 * `optionLabel` replaces the language names, e.g. with "Answer in English".
 * Always a native <select>, so the list and keyboard work everywhere.
 */
export function LanguageSelect({
  value,
  label,
  onChange,
  variant = 'boxed',
  optionLabel,
}: {
  value: Language
  label: string
  onChange: (language: Language) => void
  variant?: 'inline' | 'boxed' | 'field' | 'pill'
  optionLabel?: (language: Language) => string
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
            {optionLabel ? optionLabel(code as Language) : name}
          </option>
        ))}
      </select>
      {variant === 'field' && <ChevronDownIcon className={styles.caret} />}
      {variant === 'boxed' && (
        <span className={styles.caret} aria-hidden="true">
          ▼
        </span>
      )}
      {variant === 'pill' && (
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      )}
    </label>
  )
}
