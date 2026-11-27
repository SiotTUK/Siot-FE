import type { InputHTMLAttributes } from 'react'
import { TextField } from './field'
import { SearchIcon } from './icons'
import styles from './search-field.module.css'

/**
 * Figma "서비스 패턴 · 기록 검색": a search box with the magnifier inside on
 * the left. The label is for screen readers only; the placeholder shows.
 */
export function SearchField({
  label,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
  return (
    <div className={styles.search}>
      <SearchIcon className={styles.icon} />
      <TextField {...input} label={label} hideLabel type="search" />
    </div>
  )
}
