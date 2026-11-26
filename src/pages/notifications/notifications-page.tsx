import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { NotificationList } from '@/features/notifications/ui/notification-list'
import { NotificationSettings } from '@/features/notifications/ui/notification-settings'
import { PageBody } from '@/shared/ui/mobile-frame'
import { PageHeading } from '@/shared/ui/page'
import styles from './notifications-page.module.css'

/** M09 알림: list (NTF-04) and settings (NTF-03). */
export function NotificationsPage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('notifications.title')} />
      {me && (
        <>
          <NotificationList memberId={me.id} />
          <NotificationSettings memberId={me.id} />
        </>
      )}
    </PageBody>
  )
}
