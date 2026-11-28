import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { errorMessage } from '@/shared/i18n/error-message'
import { FormError } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { SwitchField } from '@/shared/ui/switch-field'
import type { NotificationPreference } from '../api'
import {
  deadlineLeadDays,
  emailState,
  emailUpdates,
  groupState,
  groupUpdates,
  leadDaysUpdates,
  pickedLeadDays,
  type DeadlineLeadDay,
  type PreferenceGroup,
} from '../notifications'
import { usePreferences, useUpdatePreferences } from '../use-notifications'
import { SavedEvents } from './saved-events'
import styles from './notifications.module.css'

const groups: PreferenceGroup[] = ['deadline', 'notice']

/**
 * M09 알림 설정 (NTF-03·NTF-05): a toggle per group (생활 마감·안내 내용
 * 변경), 이메일로도 받기, 기한 알림 시점 D-7·D-1, a note on where
 * notifications go, and the saved (♥) events with their manage list.
 */
export function NotificationSettings({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const titleId = useId()
  const { data: me } = useMe()
  const preferences = usePreferences(memberId)
  const update = useUpdatePreferences(memberId)
  const prefs = preferences.data ?? []
  // Locked while saving and until the settings are read again.
  const locked = update.isPending || preferences.isFetching
  const email = emailState(prefs)
  const emailVerified = me?.emailVerified ?? false

  return (
    <section
      id="settings"
      className={styles.settings}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={styles.settingsTitle}>
        {t('notifications.settings.title')}
      </h2>
      <QueryState query={preferences}>
        {groups.map((group) => {
          const state = groupState(prefs, group)
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
              disabled={locked}
              onChange={(event) => {
                const enabled = event.target.checked
                update.save((current) => groupUpdates(current, group, enabled))
              }}
            />
          )
        })}
        <SwitchField
          label={t('notifications.settings.email')}
          hint={
            !emailVerified
              ? t('notifications.settings.emailUnverified')
              : email === 'partial'
                ? t('notifications.settings.partial')
                : undefined
          }
          checked={email === 'on'}
          disabled={locked}
          onChange={(event) => {
            const enabled = event.target.checked
            update.save((current) => emailUpdates(current, enabled))
          }}
        />
        <LeadDayPicker
          prefs={prefs}
          disabled={locked || groupState(prefs, 'deadline') === 'off'}
          onChange={(picked) =>
            update.save((current) => leadDaysUpdates(current, picked))
          }
        />
        {update.isError && (
          <FormError message={errorMessage(t, update.error)} />
        )}
        <p className={styles.settingsNote}>
          {t(
            email === 'off'
              ? 'notifications.settings.noteListOnly'
              : emailVerified
                ? 'notifications.settings.noteEmail'
                : 'notifications.settings.note',
          )}
        </p>
      </QueryState>
      <SavedEvents memberId={memberId} />
    </section>
  )
}

/**
 * M09 "기한 알림 시점 D-7 · D-1": toggle buttons, at least one stays on
 * (the BE needs one or more; turning every reminder off is the 생활 마감
 * switch). Off while 생활 마감 is off.
 */
function LeadDayPicker({
  prefs,
  disabled,
  onChange,
}: {
  prefs: NotificationPreference[]
  disabled: boolean
  onChange: (picked: DeadlineLeadDay[]) => void
}) {
  const { t } = useTranslation()
  const labelId = useId()
  const picked = pickedLeadDays(prefs)
  const fixed: readonly number[] = deadlineLeadDays
  const stayEarlier = (
    prefs.find((pref) => pref.kind === 'STAY_EXPIRY')?.leadDaysList ?? []
  ).filter((day) => !fixed.includes(day))

  return (
    <div className={styles.leadDays}>
      <div className={styles.leadDaysRow}>
        <span id={labelId} className={styles.leadDaysLabel}>
          {t('notifications.settings.leadDays')}
        </span>
        <div role="group" aria-labelledby={labelId} className={styles.chips}>
          {deadlineLeadDays.map((day) => {
            const on = picked.includes(day)
            const last = on && picked.length === 1
            return (
              <button
                key={day}
                type="button"
                className={styles.chip}
                aria-pressed={on}
                aria-label={t('notifications.settings.leadDayLabel', {
                  count: day,
                })}
                disabled={disabled || last}
                onClick={() =>
                  onChange(
                    on
                      ? picked.filter((item) => item !== day)
                      : deadlineLeadDays.filter(
                          (item) => item === day || picked.includes(item),
                        ),
                  )
                }
              >
                D-{day}
              </button>
            )
          })}
        </div>
      </div>
      {stayEarlier.length > 0 && (
        <p className={styles.settingsNote}>
          {t('notifications.settings.stayEarlier', {
            days: stayEarlier.join('·'),
          })}
        </p>
      )}
    </div>
  )
}
