import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate, formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { DocumentItem, DocumentStatus } from '@/shared/ui/document'
import { FormError, Muted, Section, Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { billErrorMessage, billTranslationPath } from '../bill-translation'
import { useDeleteBill, useRecentBills } from '../use-bill-translations'

export function RecentBills({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const recent = useRecentBills(memberId)
  const deletion = useDeleteBill(memberId)
  const [confirmId, setConfirmId] = useState<number>()

  return (
    <Section title={t('bill.recent')}>
      <QueryState query={recent} keepContentOnError>
        {recent.data?.length === 0 && (
          <DocumentStatus tone="empty" label={t('bill.empty')} />
        )}
        {!!recent.data?.length && (
          <Stack as="ul" gap={10}>
            {recent.data.map((item) => (
              <DocumentItem
                key={item.id}
                title={
                  item.what ||
                  item.taxType ||
                  t(`bill.type.${item.documentType ?? 'OTHER'}`)
                }
                titleLanguage={
                  item.what ? item.language : item.taxType ? 'ko' : undefined
                }
                to={`${billTranslationPath}/${item.id}`}
                action={
                  <Button
                    variant="text"
                    disabled={deletion.isPending}
                    onClick={() => {
                      deletion.reset()
                      setConfirmId(item.id)
                    }}
                  >
                    {t('bill.delete')}
                  </Button>
                }
              >
                <Muted>{formatDateTime(item.savedAt, language)}</Muted>
                {item.dueDate && (
                  <Muted>
                    {t('bill.due')} ·{' '}
                    {formatCalendarDate(item.dueDate, language)}
                  </Muted>
                )}
                {confirmId === item.id && (
                  <>
                    {deletion.isError && (
                      <FormError
                        message={billErrorMessage(t, deletion.error)}
                      />
                    )}
                    <ConfirmPanel
                      message={t('bill.deletePrompt')}
                      confirmLabel={t('bill.delete')}
                      cancelLabel={t('common.cancel')}
                      danger
                      pending={deletion.isPending}
                      onCancel={() => setConfirmId(undefined)}
                      onConfirm={() =>
                        deletion.remove(item.id, () => setConfirmId(undefined))
                      }
                    />
                  </>
                )}
              </DocumentItem>
            ))}
          </Stack>
        )}
      </QueryState>
    </Section>
  )
}
