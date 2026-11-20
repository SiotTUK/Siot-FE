import type { Language } from '../api/types'
import { languages } from '../i18n'
import styles from './language-select.module.css'

export function LanguageSelect({
  value,
  label,
  onChange,
}: {
  value: Language
  label: string
  onChange: (language: Language) => void
}) {
  return (
    <label className={styles.wrapper}>
      <span className="visually-hidden">{label}</span>
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
      <span className={styles.caret} aria-hidden="true">
        ▼
      </span>
    </label>
  )
}
