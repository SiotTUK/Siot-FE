import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import { isLifeChangeCode } from '@/features/life-changes/life-changes'
import { LifeChangeTasks } from '@/features/life-changes/ui/life-change-tasks'
import { ButtonLink } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { ScreenHeader } from '@/shared/ui/screen-header'

/** F06b 생활 변화 · 할 일 (`/home/life-changes/:code`). */
export function LifeChangePage() {
  const { code } = useParams()
  const { data: me } = useMe()
  const { t } = useTranslation()

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

  return me ? (
    <LifeChangeTasks key={`${me.id}:${code}`} memberId={me.id} code={code} />
  ) : null
}
