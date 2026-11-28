import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { billTranslationPath } from '@/features/bill-translation/bill-translation'
import {
  defaultHomeView,
  type HomeView,
} from '@/features/calendar/monthly-todos'
import { MonthlyTodosSection } from '@/features/calendar/ui/monthly-todos-section'
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
import { ChipGroup } from '@/shared/ui/chip-group'
import { CameraIcon } from '@/shared/ui/icons'
import { PageBody } from '@/shared/ui/mobile-frame'
import { TextLink } from '@/shared/ui/text-link'
import styles from './home-page.module.css'

/**
 * Figma v2 맞춤 홈. CAL-02·CHK-04: NEW opens the settlement checklist first,
 * LIVING opens this month's to-dos first, and members can switch at the top.
 */
export function HomePage() {
  const { data: me } = useMe()
  return (
    <PageBody className={styles.body}>
      {me && <HomeContent key={`${me.id}:${me.userType ?? ''}`} member={me} />}
    </PageBody>
  )
}

function HomeContent({ member }: { member: MemberResponse }) {
  const { t } = useTranslation()
  const [view, setView] = useState<HomeView>(() =>
    defaultHomeView(member.userType),
  )

  return (
    <>
      <ChipGroup
        variant="pill"
        label={t('home.viewSwitch')}
        value={view}
        onChange={setView}
        options={[
          { value: 'checklist', label: t('home.viewChecklist') },
          { value: 'monthly', label: t('home.viewMonthlyTodos') },
        ]}
      />
      {view === 'checklist' ? (
        <ChecklistHomeView member={member} />
      ) : (
        <MonthlyTodosHomeView member={member} />
      )}
    </>
  )
}

function SituationBar({
  member,
  compact = false,
}: {
  member: MemberResponse
  compact?: boolean
}) {
  const { t } = useTranslation()
  const situation = situationSummary(t, member)
  return (
    <div className={styles.situation} data-compact={compact || undefined}>
      <p>{[situation.title, situation.detail].filter(Boolean).join(' · ')}</p>
      <TextLink to="/me" aria-label={t('home.situationEditLabel')}>
        {t('home.situationEdit')} ›
      </TextLink>
    </div>
  )
}

function HomeActionTiles({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  return (
    <div className={styles.tiles}>
      <LifeChangeTile memberId={memberId} />
      <ActionTile
        to={billTranslationPath}
        tone="warning"
        icon={<CameraIcon />}
        title={t('home.billTitle')}
        description={t('home.billLabel')}
      />
    </div>
  )
}

/**
 * H1 (a deadline within 30 days): hero, my situation, my tasks, 생활 변화,
 * bill translation, events. H2 (nothing urgent): events come before "다음 할 일".
 * The order is fixed on entry.
 */
function ChecklistHomeView({ member }: { member: MemberResponse }) {
  const checklist = useChecklist(member.id, currentLanguage())
  // The H1/H2 order is decided once, when the checklist first loads on entry.
  // Checking items only updates the hero card; the list the member is
  // tapping doesn't jump below the events until the next visit.
  const [calmOnEntry, setCalmOnEntry] = useState<boolean>()
  if (checklist.data && calmOnEntry === undefined)
    setCalmOnEntry(homeHero(checklist.data.items).kind === 'calm')
  const calm = calmOnEntry ?? false

  const tasks = <ChecklistSection memberId={member.id} calm={calm} />
  const events = <EventRecommendations memberId={member.id} showAllLink />

  return (
    <>
      {checklist.data && <HomeHero checklist={checklist.data} />}
      <SituationBar member={member} compact={Boolean(checklist.data)} />
      {calm ? events : tasks}
      {calm && tasks}
      <HomeActionTiles memberId={member.id} />
      {!calm && events}
    </>
  )
}

function MonthlyTodosHomeView({ member }: { member: MemberResponse }) {
  return (
    <>
      <SituationBar member={member} />
      <MonthlyTodosSection memberId={member.id} />
      <HomeActionTiles memberId={member.id} />
      <EventRecommendations memberId={member.id} showAllLink />
    </>
  )
}
