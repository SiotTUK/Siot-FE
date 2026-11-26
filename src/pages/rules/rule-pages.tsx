import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { RuleDetail } from '@/features/rules/ui/rule-detail'
import { RuleBrowser } from '@/features/rules/ui/rule-groups'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, PageHeading } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import styles from './rule-pages.module.css'

/** M06 생활 수칙: search, category chips, FAQ TOP 5 and guides by topic. */
export function RulesPage() {
  const { t } = useTranslation()
  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('rules.title')} />
      <RuleBrowser />
    </PageBody>
  )
}

export function RuleDetailPage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <ScreenHeader
        title={t('rules.detail')}
        back={{
          label: t('common.back'),
          onClick: () => {
            if (state?.from === 'rules') void navigate(-1)
            else void navigate('/rules', { replace: true })
          },
        }}
      />
      <PageBody className={styles.body}>
        {code ? (
          <RuleDetail code={code} />
        ) : (
          <Muted>{t('rules.notFound')}</Muted>
        )}
      </PageBody>
    </>
  )
}
