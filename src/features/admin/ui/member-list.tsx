import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { SelectField, TextField } from '@/shared/ui/field'
import { Card, FormError, Muted, Tag, Toolbar } from '@/shared/ui/page'
import { InfiniteList } from '@/shared/ui/query-state'
import type { AdminMemberResponse, Role } from '../api'
import { useChangeRole, useMembers } from '../use-admin'

const otherRole = (role: Role): Role => (role === 'ADMIN' ? 'USER' : 'ADMIN')

/** ADM-01: search members (newest first) and change their role. */
export function MemberList() {
  const { t } = useTranslation()
  const myId = useMe().data?.id
  const [email, setEmail] = useState('')
  const [filter, setFilter] = useState({ email: '', role: '' as Role | '' })
  const [confirming, setConfirming] = useState<number>()
  const members = useMembers(filter.email, filter.role)
  const change = useChangeRole()

  const row = (member: AdminMemberResponse) => (
    <Card>
      <Toolbar justify="between">
        <strong>
          {member.email}
          {member.id === myId && ` (${t('admin.me')})`}
        </strong>
        <Tag tone={member.role === 'ADMIN' ? 'main' : 'neutral'}>
          {t(`admin.${member.role}`)}
        </Tag>
      </Toolbar>
      <Muted>
        {t('admin.joinedAt', {
          date: formatDateTime(member.createdAt, currentLanguage()),
        })}
      </Muted>
      {confirming === member.id ? (
        <ConfirmPanel
          message={t('admin.roleConfirm', {
            email: member.email,
            role: t(`admin.${otherRole(member.role)}`),
          })}
          confirmLabel={t('admin.confirm')}
          cancelLabel={t('common.cancel')}
          pending={change.isPending}
          onCancel={() => setConfirming(undefined)}
          onConfirm={() =>
            change.mutate(
              { memberId: member.id, role: otherRole(member.role) },
              { onSettled: () => setConfirming(undefined) },
            )
          }
        />
      ) : (
        // Own row: the server refuses self-demotion (ADMIN_SELF_DEMOTION).
        member.id !== myId && (
          <Toolbar>
            <Button
              variant="secondary"
              onClick={() => {
                change.reset()
                setConfirming(member.id)
              }}
            >
              {t(
                member.role === 'ADMIN' ? 'admin.makeUser' : 'admin.makeAdmin',
              )}
            </Button>
          </Toolbar>
        )
      )}
    </Card>
  )

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setFilter((current) => ({ ...current, email: email.trim() }))
        }}
      >
        <Toolbar>
          <TextField
            label={t('admin.searchEmail')}
            type="search"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <SelectField
            label={t('admin.roleFilter')}
            value={filter.role}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                role: event.target.value as Role | '',
              }))
            }
            options={[
              { value: '', label: t('admin.all') },
              { value: 'USER', label: t('admin.USER') },
              { value: 'ADMIN', label: t('admin.ADMIN') },
            ]}
          />
          <Button type="submit" variant="secondary">
            {t('admin.search')}
          </Button>
        </Toolbar>
      </form>
      {change.isError && <FormError message={errorMessage(t, change.error)} />}
      <InfiniteList
        query={members}
        empty={t('admin.empty')}
        getKey={(member) => member.id}
        renderItem={row}
      />
    </>
  )
}
