import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { homeHero } from '@/features/checklist/checklist'
import { useChecklist } from '@/features/checklist/use-checklist'
import { ChecklistSection } from '@/features/checklist/ui/home-checklist'
import { HomeHero } from '@/features/checklist/ui/home-hero'
import { EventRecommendations } from '@/features/events/ui/event-recommendations'
import { LifeChangeTile } from '@/features/life-changes/ui/life-change-tile'
import { situationSummary } from '@/features/onboarding/summary'
import type { MemberResponse } from '@/shared/api/types'
import { currentLanguage } from '@/shared/i18n'
import { ActionTile } from '@/shared/ui/action-tile'
import { CameraIcon } from '@/shared/ui/icons'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Tag } from '@/shared/ui/page'
import { TextLink } from '@/shared/ui/text-link'
import styles from './home-page.module.css'

/**
 * Figma v2 맞춤 홈. H1 (a deadline within 30 days): hero, my situation, my
 * tasks, 생활 변화, bill translation, events. H2 (nothing urgent): events
 * come before "다음 할 일". The order is fixed on entry (see HomeContent).
 */
export function HomePage() {
  const { data: me } = useMe()
  return (
    <PageBody className={styles.body}>
      {me && <HomeContent key={me.id} member={me} />}
    </PageBody>
  )
}

function HomeContent({ member }: { member: MemberResponse }) {
  const { t } = useTranslation()
  const checklist = useChecklist(member.id, currentLanguage())
  // The H1/H2 order is decided once, when the checklist first loads on entry.
  // Checking items only updates the hero card; the list the member is
  // tapping doesn't jump below the events until the next visit.
  const [calmOnEntry, setCalmOnEntry] = useState<boolean>()
  if (checklist.data && calmOnEntry === undefined)
    setCalmOnEntry(homeHero(checklist.data.items).kind === 'calm')
  const calm = calmOnEntry ?? false
  const situation = situationSummary(t, member)

  const tasks = <ChecklistSection memberId={member.id} calm={calm} />
  const events = <EventRecommendations memberId={member.id} showAllLink />

  return (
    <>
      {checklist.data && <HomeHero checklist={checklist.data} />}
      <div className={styles.situation}>
        <p>{[situation.title, situation.detail].filter(Boolean).join(' · ')}</p>
        <TextLink to="/me" aria-label={t('home.situationEditLabel')}>
          {t('home.situationEdit')} ›
        </TextLink>
      </div>
      {calm ? events : tasks}
      {calm && tasks}
      <div className={styles.tiles}>
        <LifeChangeTile memberId={member.id} />
        <ActionTile
          tone="warning"
          icon={<CameraIcon />}
          title={t('home.billTitle')}
          description={t('home.billLabel')}
          trailing={<Tag>{t('home.comingSoon')}</Tag>}
        />
      </div>
      {!calm && events}
    </>
  )
}
