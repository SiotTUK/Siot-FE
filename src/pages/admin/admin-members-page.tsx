import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminMemberResponse, Role } from '@/features/admin/api'
import { useChangeRole, useMembers } from '@/features/admin/use-admin'
import { useMe } from '@/features/auth/use-session'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { PageLoader } from '@/shared/ui/mobile-frame'
import { FormError } from '@/shared/ui/page'
import { AdminScreen } from './admin-layout'
import styles from './admin.module.css'

/** ADM-01: search members (newest first) and change their role. */
export function AdminMembersPage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const [emailInput, setEmailInput] = useState('')
  const [filter, setFilter] = useState<{ email: string; role: Role | '' }>({
    email: '',
    role: '',
  })
  const [confirming, setConfirming] = useState<AdminMemberResponse>()
  const members = useMembers(filter.email, filter.role)
  const change = useChangeRole()
  const items = members.data?.pages.flatMap((page) => page.content) ?? []
  const nextRole = (role: Role): Role => (role === 'ADMIN' ? 'USER' : 'ADMIN')

  return (
    <AdminScreen title={t('admin.menuMembers')} backTo="/admin">
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault()
          setFilter((current) => ({ ...current, email: emailInput.trim() }))
        }}
      >
        <label className={styles.filterField}>
          <span>{t('admin.searchEmail')}</span>
          <input
            type="search"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
          />
        </label>
        <label className={styles.filterField}>
          <span>{t('admin.roleFilter')}</span>
          <select
            value={filter.role}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                role: event.target.value as Role | '',
              }))
            }
          >
            <option value="">{t('admin.all')}</option>
            <option value="USER">{t('admin.USER')}</option>
            <option value="ADMIN">{t('admin.ADMIN')}</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">
          {t('admin.search')}
        </Button>
      </form>

      {change.isError && <FormError message={errorMessage(t, change.error)} />}

      {members.isPending ? (
        <PageLoader label={t('common.loading')} />
      ) : members.isError ? (
        <FormError message={errorMessage(t, members.error)} />
      ) : items.length === 0 ? (
        <p className={styles.empty}>{t('admin.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((member) => (
            <li key={member.id} className={styles.card}>
              <div className={styles.cardHead}>
                <strong className={styles.email}>
                  {member.email}
                  {member.id === me?.id && ` (${t('admin.me')})`}
                </strong>
                <span className={styles.tag} data-role={member.role}>
                  {t(`admin.${member.role}`)}
                </span>
              </div>
              <p className={styles.muted}>
                {t('admin.joinedAt', {
                  date: formatDateTime(member.createdAt, currentLanguage()),
                })}
              </p>
              {confirming?.id === member.id ? (
                <div className={styles.confirm} role="group">
                  <p>
                    {t('admin.roleConfirm', {
                      email: member.email,
                      role: t(`admin.${nextRole(member.role)}`),
                    })}
                  </p>
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      disabled={change.isPending}
                      onClick={() => setConfirming(undefined)}
                    >
                      {t('admin.cancel')}
                    </Button>
                    <Button
                      variant="secondary"
                      loading={change.isPending}
                      onClick={() =>
                        change.mutate(
                          { memberId: member.id, role: nextRole(member.role) },
                          { onSettled: () => setConfirming(undefined) },
                        )
                      }
                    >
                      {t('admin.confirm')}
                    </Button>
                  </div>
                </div>
              ) : member.id === me?.id ? null : (
                // Own row: the server refuses self-demotion (ADMIN_SELF_DEMOTION).
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      change.reset()
                      setConfirming(member)
                    }}
                  >
                    {member.role === 'ADMIN'
                      ? t('admin.makeUser')
                      : t('admin.makeAdmin')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {members.hasNextPage && (
        <Button
          variant="secondary"
          loading={members.isFetchingNextPage}
          onClick={() => void members.fetchNextPage()}
        >
          {t('admin.loadMore')}
        </Button>
      )}
    </AdminScreen>
  )
}
