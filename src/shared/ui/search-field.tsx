import { TextField } from './field'
import { SearchIcon } from './icons'
import styles from './search-field.module.css'

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className={styles.search}>
      <SearchIcon className={styles.icon} />
      <TextField
        label={label}
        hideLabel
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
