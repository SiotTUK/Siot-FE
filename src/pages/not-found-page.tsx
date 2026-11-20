import { useTranslation } from 'react-i18next'
import { ButtonLink } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import styles from './pages.module.css'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <PageBody className={styles.notFound}>
      <h1>{t('notFound.title')}</h1>
      <ButtonLink to="/">{t('notFound.home')}</ButtonLink>
    </PageBody>
  )
}
