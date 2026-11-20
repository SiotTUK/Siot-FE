import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageBody } from '@/shared/ui/mobile-frame'
import styles from './admin.module.css'

/** Admin screens: ‹ back + title, then the page. */
export function AdminScreen({
  title,
  backTo,
  children,
}: {
  title: string
  backTo: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <>
      <header className={styles.header}>
        <Link className={styles.back} to={backTo} aria-label={t('admin.back')}>
          <span aria-hidden="true">‹</span>
        </Link>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <PageBody className={styles.body}>{children}</PageBody>
    </>
  )
}
