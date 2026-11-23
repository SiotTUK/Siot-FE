import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import {
  ChecklistProgress,
  ChecklistSection,
} from '@/features/checklist/ui/home-checklist'
import { situationSummary } from '@/features/onboarding/summary'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Notice, Section, Tag } from '@/shared/ui/page'
import styles from './home-page.module.css'

/**
 * H1/H2 personalized home: checklist progress and items (server-computed
 * deadlines), my situation. Events, bill translation and life changes are
 * still "coming soon".
 */
export function HomePage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const situation = me ? situationSummary(t, me) : undefined
  const comingSoon = <Tag>{t('home.comingSoon')}</Tag>

  return (
    <PageBody className={styles.body}>
      {me && <ChecklistProgress memberId={me.id} />}
      {situation && (
        <Notice tone="note" title={situation.title}>
          {situation.detail}
        </Notice>
      )}
      {me && <ChecklistSection key={me.id} memberId={me.id} />}
      <div className={styles.row} data-tone="info">
        <div>
          <strong>{t('home.billTitle')}</strong>
          <Muted>{t('home.billLabel')}</Muted>
        </div>
        {comingSoon}
      </div>
      <Section title={t('home.eventsTitle')}>
        <p className={styles.empty}>{t('home.eventsEmpty')}</p>
      </Section>
      <div className={styles.row} aria-disabled="true">
        <strong>{t('home.lifeChange')}</strong>
        {comingSoon}
      </div>
    </PageBody>
  )
}
