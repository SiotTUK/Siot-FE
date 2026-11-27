import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { pickDeadlineAlert } from '@/features/checklist/checklist'
import {
  ChecklistProgress,
  ChecklistSection,
} from '@/features/checklist/ui/home-checklist'
import { useChecklist } from '@/features/checklist/use-checklist'
import { EventRecommendations } from '@/features/events/ui/event-recommendations'
import { LifeChangePicker } from '@/features/life-changes/ui/life-change-picker'
import { situationSummary } from '@/features/onboarding/summary'
import type { MemberResponse } from '@/shared/api/types'
import { currentLanguage } from '@/shared/i18n'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Tag } from '@/shared/ui/page'
import { TextLink } from '@/shared/ui/text-link'
import styles from './home-page.module.css'

/**
 * H1/H2 personalized home: checklist progress and items (server-computed
 * deadlines), my situation and life changes.
 */
export function HomePage() {
  const { data: me } = useMe()
  return (
    <PageBody className={styles.body}>
      {me && <MemberHome key={me.id} me={me} />}
    </PageBody>
  )
}

/**
 * H1 by default. H2 (nothing due within 30 days): calm card on top, events
 * move up and the checklist shrinks to "다음 할 일".
 */
function MemberHome({ me }: { me: MemberResponse }) {
  const { t } = useTranslation()
  const { data: checklist } = useChecklist(me.id, currentLanguage())
  const calm = checklist ? !pickDeadlineAlert(checklist.items) : false
  const situation = situationSummary(t, me)
  const events = <EventRecommendations memberId={me.id} showAllLink />

  return (
    <>
      <ChecklistProgress memberId={me.id} />
      <div className={styles.situation}>
        <div>
          {situation.title && <strong>{situation.title}</strong>}
          <Muted>{situation.detail}</Muted>
        </div>
        <TextLink to="/me" aria-label={t('home.situationEditLabel')}>
          {t('home.situationEdit')} ›
        </TextLink>
      </div>
      {calm && events}
      <ChecklistSection memberId={me.id} calm={calm} />
      <div className={styles.row} data-tone="info">
        <div>
          <strong>{t('home.billTitle')}</strong>
          <Muted>{t('home.billLabel')}</Muted>
        </div>
        <Tag>{t('home.comingSoon')}</Tag>
      </div>
      {!calm && events}
      <LifeChangePicker memberId={me.id} />
    </>
  )
}
