import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/i18n/error-message'
import { FormError } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { SwitchField } from '@/shared/ui/switch-field'
import { groupState, type PreferenceGroup } from '../notifications'
import { usePreferences, useUpdatePreferenceGroup } from '../use-notifications'
import styles from './notifications.module.css'

const groups: PreferenceGroup[] = ['deadline', 'notice']

/**
 * M09 알림 설정 (NTF-03): a card with its title inside and a toggle per
 * group (생활 마감·안내 내용 변경). Reminder timing is fixed by the BE
 * scheduler and e-mail opt-out / event subscriptions wait for BE APIs,
 * so those rows from the design are not shown.
 */
export function NotificationSettings({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const titleId = useId()
  const preferences = usePreferences(memberId)
  const update = useUpdatePreferenceGroup(memberId)

  return (
    <section className={styles.settings} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.settingsTitle}>
        {t('notifications.settings.title')}
      </h2>
      <QueryState query={preferences}>
        {groups.map((group) => {
          const state = groupState(preferences.data ?? [], group)
          return (
            <SwitchField
              key={group}
              label={t(`notifications.settings.${group}`)}
              // Partial shows off with a line saying some still arrive;
              // switching it on then turns every kind on.
              hint={
                state === 'partial'
                  ? t('notifications.settings.partial')
                  : undefined
              }
              checked={state === 'on'}
              // Locked while saving and until the settings are read again.
              disabled={update.isPending || preferences.isFetching}
              onChange={(event) =>
                update.mutate({ group, enabled: event.target.checked })
              }
            />
          )
        })}
        {update.isError && (
          <FormError message={errorMessage(t, update.error)} />
        )}
        <p className={styles.settingsNote}>
          {t('notifications.settings.note')}
        </p>
      </QueryState>
    </section>
  )
}
