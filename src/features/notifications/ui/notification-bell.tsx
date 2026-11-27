import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { BellIcon } from '@/shared/ui/icons'
import { TopBarIconButton } from '@/shared/ui/top-bar'
import { unreadBadge } from '../notifications'
import { useUnreadCount } from '../use-notifications'

/** Top-bar bell (NTF-04): opens the list and shows the unread count. */
export function NotificationBell() {
  const { data: me } = useMe()
  return me ? <Bell memberId={me.id} /> : null
}

function Bell({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const { data: count } = useUnreadCount(memberId)
  return (
    <TopBarIconButton
      label={t('notifications.title')}
      icon={<BellIcon />}
      badge={unreadBadge(count)}
      badgeLabel={t('notifications.unread', { count: count ?? 0 })}
      to="/notifications"
    />
  )
}
