import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { Card, FormError } from '@/shared/ui/page'
import { InfiniteList } from '@/shared/ui/query-state'
import { useConversations, useDeleteConversation } from '../use-chat'
import styles from './chat.module.css'

/** CB-03 past conversations, newest first. Deleting cannot be undone. */
export function ConversationList() {
  const { t } = useTranslation()
  const conversations = useConversations()
  const remove = useDeleteConversation()
  const [confirmId, setConfirmId] = useState<number>()

  return (
    <>
      {remove.isError && <FormError message={errorMessage(t, remove.error)} />}
      <InfiniteList
        query={conversations}
        empty={t('chat.historyEmpty')}
        getKey={(item) => item.conversationId}
        renderItem={(item) =>
          confirmId === item.conversationId ? (
            <ConfirmPanel
              danger
              message={t('chat.deleteConfirm')}
              confirmLabel={t('chat.delete')}
              cancelLabel={t('common.cancel')}
              pending={remove.isPending}
              onCancel={() => setConfirmId(undefined)}
              onConfirm={() =>
                remove.mutate(item.conversationId, {
                  onSuccess: () => setConfirmId(undefined),
                })
              }
            />
          ) : (
            <Card>
              <div className={styles.historyRow}>
                <Link to={`/chat/${item.conversationId}`}>
                  <strong>{item.title ?? t('chat.untitled')}</strong>
                  <span>
                    {formatDateTime(item.updatedAt, currentLanguage())}
                  </span>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => {
                    remove.reset()
                    setConfirmId(item.conversationId)
                  }}
                >
                  {t('chat.delete')}
                </Button>
              </div>
            </Card>
          )
        }
      />
    </>
  )
}
