import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { situationSummary } from '@/features/onboarding/summary'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Notice, Section, Tag } from '@/shared/ui/page'
import styles from './home-page.module.css'

/**
 * H1/H2 personalized home — layout shell.
 * Only "my situation" uses real data (onboarding answers in MemberResponse).
 * Checklist, events and bill translation wait for BE APIs and show a
 * "coming soon" state; nothing here is mock data.
 */
export function HomePage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const situation = me ? situationSummary(t, me) : undefined
  const comingSoon = <Tag>{t('home.comingSoon')}</Tag>

  return (
    <PageBody className={styles.body}>
      <div className={styles.todo}>
        <h1>{t('home.todoTitle')}</h1>
        <Muted>{t('home.todoPending')}</Muted>
      </div>
      {situation && (
        <Notice tone="note" title={situation.title}>
          {situation.detail}
        </Notice>
      )}
      <Section title={t('home.checklistTitle')}>
        <p className={styles.empty}>{t('home.checklistEmpty')}</p>
      </Section>
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
