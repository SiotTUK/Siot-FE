import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageBody } from '@/shared/ui/mobile-frame'
import styles from './pages.module.css'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <PageBody>
      <div className={styles.center}>
        <h1>{t('notFound.title')}</h1>
        <Link className={styles.buttonLink} to="/">
          {t('notFound.home')}
        </Link>
      </div>
    </PageBody>
  )
}
