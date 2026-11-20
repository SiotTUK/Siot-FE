import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { situationSummary } from '@/features/onboarding/summary'
import { PageBody } from '@/shared/ui/mobile-frame'
import styles from './home-page.module.css'

/**
 * H1/H2 personalized home — layout shell.
 * Only "my situation" uses real data (onboarding answers in MemberResponse).
 * Checklist, alerts, events and bill translation wait for BE APIs and show
 * a "coming soon" state; nothing here is mock data.
 */
export function HomePage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const situation = me ? situationSummary(t, me) : undefined

  return (
    <PageBody className={styles.body}>
      <section className={styles.todo} aria-labelledby="home-todo">
        <h1 id="home-todo" className={styles.todoTitle}>
          {t('home.todoTitle')}
        </h1>
        <p className={styles.muted}>{t('home.todoPending')}</p>
      </section>

      {situation && (
        <section className={styles.situation}>
          <p className={styles.situationTitle}>{situation.title}</p>
          <p className={styles.muted}>{situation.detail}</p>
        </section>
      )}

      <section aria-labelledby="home-checklist">
        <h2 id="home-checklist" className={styles.sectionTitle}>
          {t('home.checklistTitle')}
        </h2>
        <p className={styles.empty}>{t('home.checklistEmpty')}</p>
      </section>

      <section className={styles.bill}>
        <div>
          <p className={styles.billTitle}>{t('home.billTitle')}</p>
          <p className={styles.muted}>{t('home.billLabel')}</p>
        </div>
        <span className={styles.badge}>{t('home.comingSoon')}</span>
      </section>

      <section aria-labelledby="home-events">
        <h2 id="home-events" className={styles.sectionTitle}>
          {t('home.eventsTitle')}
        </h2>
        <p className={styles.empty}>{t('home.eventsEmpty')}</p>
      </section>

      <div className={styles.row} aria-disabled="true">
        <span>{t('home.lifeChange')}</span>
        <span className={styles.badge}>{t('home.comingSoon')}</span>
      </div>
    </PageBody>
  )
}
