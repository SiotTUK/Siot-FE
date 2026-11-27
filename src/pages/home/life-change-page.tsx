import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import { isLifeChangeCode } from '@/features/life-changes/life-changes'
import { LifeChangeEditor } from '@/features/life-changes/ui/life-change-editor'
import { LifeChangeStart } from '@/features/life-changes/ui/life-change-start'
import { ButtonLink } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { ScreenHeader } from '@/shared/ui/screen-header'

/** /home/life-changes → F06a; /home/life-changes/:code → F06b. */
export function LifeChangePage() {
  const { code } = useParams()
  const { data: me } = useMe()
  const { t } = useTranslation()

  if (!me) return null
  if (code === undefined)
    return <LifeChangeStart key={me.id} memberId={me.id} />
  if (!isLifeChangeCode(code))
    return (
      <>
        <ScreenHeader title={t('lifeChanges.trigger')} />
        <PageBody>
          <p>{t('errors.INVALID_LIFE_CHANGE_CODE')}</p>
          <ButtonLink to="/home">{t('lifeChanges.backHome')}</ButtonLink>
        </PageBody>
      </>
    )

  return (
    <LifeChangeEditor key={`${me.id}:${code}`} memberId={me.id} code={code} />
  )
}
