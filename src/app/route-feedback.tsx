import { useEffect, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { FormError, Stack } from '@/shared/ui/page'
import type { DeferredScreen } from './deferred-module'

export function DeferredPage({ screen }: { screen: DeferredScreen }) {
  const { t } = useTranslation()
  const [page, setPage] = useState<ComponentType | 'failed' | null>(
    screen.getLoaded,
  )

  useEffect(() => {
    let active = true
    void screen.load().then(
      (Component) => {
        if (active) setPage(() => Component)
      },
      () => {
        if (active) setPage('failed')
      },
    )
    return () => {
      active = false
    }
  }, [screen])

  if (page === null) return <PageLoader label={t('common.loading')} />
  if (page === 'failed') return <RouteLoadFailure />
  const Component = page
  return <Component />
}

function RouteLoadFailure() {
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
