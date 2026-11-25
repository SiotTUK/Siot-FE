import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { FormError, Muted } from '@/shared/ui/page'

export function EventQueryNotice({
  pending,
  fetching,
  retry,
}: {
  pending: boolean
  fetching: boolean
  retry: () => void
}) {
  const { t } = useTranslation()
  if (pending)
    return (
      <div role="status">
        <Muted>{t('common.loading')}</Muted>
      </div>
    )

  return (
    <>
      <FormError message={t('events.error')} />
      <Button variant="secondary" loading={fetching} onClick={retry}>
        {t('common.retry')}
      </Button>
    </>
  )
}
