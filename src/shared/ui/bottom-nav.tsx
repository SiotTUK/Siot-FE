import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './bottom-nav.module.css'

export interface BottomNavItem {
  label: string
  icon: ComponentType
  /** Omit for menus that are not built yet; they render disabled. */
  to?: string
}

/** Bottom tab bar of the member screens. */
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
      {items.map(({ icon: ItemIcon, ...item }) =>
        item.to ? (
          <NavLink
            key={item.label}
            to={item.to}
            end
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`.trim()
            }
          >
            <ItemIcon />
            {item.label}
          </NavLink>
        ) : (
          <span
            key={item.label}
            className={`${styles.item} ${styles.disabled}`}
            aria-disabled="true"
          >
            <ItemIcon />
            {item.label}
            <span className="visually-hidden"> ({disabledHint})</span>
          </span>
        ),
      )}
    </nav>
  )
}
