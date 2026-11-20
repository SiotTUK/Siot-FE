import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AdminScreen } from './admin-layout'
import styles from './admin.module.css'

const menus = [
  {
    to: '/admin/members',
    title: 'admin.menuMembers',
    desc: 'admin.menuMembersDesc',
  },
  {
    to: '/admin/reviews',
    title: 'admin.menuReviews',
    desc: 'admin.menuReviewsDesc',
  },
  {
    to: '/admin/guides',
    title: 'admin.menuGuides',
    desc: 'admin.menuGuidesDesc',
  },
] as const

export function AdminHomePage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.title')} backTo="/me">
      <ul className={styles.menu}>
        {menus.map((menu) => (
          <li key={menu.to}>
            <Link className={styles.menuItem} to={menu.to}>
              <strong>{t(menu.title)}</strong>
              <span>{t(menu.desc)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminScreen>
  )
}
