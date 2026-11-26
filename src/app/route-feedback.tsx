import { useTranslation } from 'react-i18next'
import { useNavigation } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { MobileFrame, PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { FormError, Stack } from '@/shared/ui/page'
import styles from './route-feedback.module.css'

export function InitialRouteLoading() {
  const { t } = useTranslation()
  return (
    <MobileFrame>
      <PageLoader label={t('common.loading')} />
    </MobileFrame>
  )
}

export function RouteNavigationLoading() {
  const { t } = useTranslation()
  const { state } = useNavigation()
  if (state !== 'loading') return null
  return (
    <div className={styles.pending}>
      <PageLoader label={t('common.loading')} />
    </div>
  )
}

export function RouteLoadFailure() {
  const { t } = useTranslation()
  return (
    <PageBody>
      <Stack gap={12}>
        <FormError message={t('common.pageLoadFailed')} />
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('common.reloadPage')}
        </Button>
      </Stack>
    </PageBody>
  )
}
