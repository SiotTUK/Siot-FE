import { useTranslation } from 'react-i18next'
import { ButtonLink } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { StatusCard } from '@/shared/ui/status-card'
import styles from './pages.module.css'

/** Figma v2 M13 "페이지를 찾을 수 없어요 · 홈으로". */
export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <PageBody className={styles.notFound}>
      <h1 className="visually-hidden">{t('notFound.title')}</h1>
      <StatusCard
        mascot="duo"
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={<ButtonLink to="/">{t('notFound.home')}</ButtonLink>}
      />
    </PageBody>
  )
}
