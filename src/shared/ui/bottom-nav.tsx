import { NavLink } from 'react-router-dom'
import styles from './bottom-nav.module.css'

export interface BottomNavItem {
  label: string
  /** Omit for menus that are not built yet; they render disabled. */
  to?: string
}

/** Bottom tab bar of the member screens (홈·생활 달력·생활 수칙·질문·내 정보). */
export function BottomNav({
  label,
  items,
  disabledHint,
}: {
  label: string
  items: BottomNavItem[]
  /** Read by screen readers for disabled tabs, e.g. "준비 중". */
  disabledHint: string
}) {
  return (
    <nav className={styles.nav} aria-label={label}>
      {items.map((item) =>
        item.to ? (
          <NavLink
            key={item.label}
            to={item.to}
            end
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`.trim()
            }
          >
            <span className={styles.icon} aria-hidden="true" />
            {item.label}
          </NavLink>
        ) : (
          <span
            key={item.label}
            className={`${styles.item} ${styles.disabled}`}
            aria-disabled="true"
          >
            <span className={styles.icon} aria-hidden="true" />
            {item.label}
            <span className="visually-hidden"> ({disabledHint})</span>
          </span>
        ),
      )}
    </nav>
  )
}
