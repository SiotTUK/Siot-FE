import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { NotificationList } from '@/features/notifications/ui/notification-list'
import { NotificationSettings } from '@/features/notifications/ui/notification-settings'
import { SettingsIcon } from '@/shared/ui/icons'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { PageBody } from '@/shared/ui/mobile-frame'
import { PageHeading } from '@/shared/ui/page'
import styles from './notifications-page.module.css'

/**
 * M09 알림 (Figma v2): title with "설정", 해로 tip, the list (NTF-04) and the
 * settings card under it (NTF-03).
 */
export function NotificationsPage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  return (
    <PageBody className={styles.body}>
      <div className={styles.titleRow}>
        <PageHeading title={t('notifications.title')} />
        <a className={styles.settingsLink} href="#settings">
          <SettingsIcon />
          {t('notifications.settingsLink')}
        </a>
      </div>
      <MascotTip mascot="haero">{t('notifications.tip')}</MascotTip>
      {me && (
        <>
          <NotificationList memberId={me.id} />
          <NotificationSettings memberId={me.id} />
        </>
      )}
    </PageBody>
  )
}
