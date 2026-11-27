import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import { billTranslationPath } from '@/features/bill-translation/bill-translation'
import {
  ChecklistProgress,
  ChecklistSection,
} from '@/features/checklist/ui/home-checklist'
import { EventRecommendations } from '@/features/events/ui/event-recommendations'
import { LifeChangePicker } from '@/features/life-changes/ui/life-change-picker'
import { situationSummary } from '@/features/onboarding/summary'
import { ButtonLink } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Notice } from '@/shared/ui/page'
import styles from './home-page.module.css'

/**
 * H1/H2 personalized home: checklist progress and items (server-computed
 * deadlines), my situation and life changes.
 */
export function HomePage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const [params] = useSearchParams()
  const guide = params.get('guide')
  const situation = me ? situationSummary(t, me) : undefined

  return (
    <PageBody className={styles.body}>
      {me && <ChecklistProgress memberId={me.id} />}
      {situation && (
        <Notice tone="note" title={situation.title}>
          {situation.detail}
        </Notice>
      )}
      {me && (
        <ChecklistSection
          key={`${me.id}:${guide ?? ''}`}
          memberId={me.id}
          guideCode={guide}
        />
      )}
      <div className={styles.row} data-tone="info">
        <div>
          <strong>{t('home.billTitle')}</strong>
          <Muted>{t('home.billLabel')}</Muted>
        </div>
        <ButtonLink
          variant="secondary"
          to={billTranslationPath}
          aria-label={`${t('bill.entry')} · ${t('bill.title')}`}
        >
          {t('bill.entry')}
        </ButtonLink>
      </div>
      {me && <EventRecommendations memberId={me.id} showAllLink />}
      {me && <LifeChangePicker key={me.id} memberId={me.id} />}
    </PageBody>
  )
}
