import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  useConversations,
  useDeleteConversation,
} from '@/features/chat/use-chat'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageLoader } from '@/shared/ui/mobile-frame'
import { FormError } from '@/shared/ui/page'
import { ChatHeader } from './chat-header'
import styles from './chat.module.css'

function formatTime(value: string, language: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

/** CB-03 past conversations, newest first. Deleting cannot be undone. */
export function ChatHistoryPage() {
  const { t } = useTranslation()
  const conversations = useConversations()
  const remove = useDeleteConversation()
  const [confirmId, setConfirmId] = useState<number>()
  const items = conversations.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <div className={styles.screen}>
      <ChatHeader
        title={t('chat.historyTitle')}
        backTo="/chat"
        backLabel={t('chat.title')}
      >
        <Link className={styles.headerLink} to="/chat">
          {t('chat.newChat')}
        </Link>
      </ChatHeader>

      <main className={styles.log}>
        {conversations.isPending ? (
          <PageLoader label={t('common.loading')} />
        ) : conversations.isError ? (
          <div className={styles.center}>
            <FormError message={errorMessage(t, conversations.error)} />
            <Button
              variant="secondary"
              loading={conversations.isFetching}
              onClick={() => void conversations.refetch()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className={styles.center}>{t('chat.historyEmpty')}</p>
        ) : (
          <ul className={styles.historyList}>
            {items.map((item) => (
              <li key={item.conversationId} className={styles.historyItem}>
                {confirmId === item.conversationId ? (
                  <div className={styles.confirm} role="group">
                    <p>{t('chat.deleteConfirm')}</p>
                    <div className={styles.confirmActions}>
                      <Button
                        variant="secondary"
                        disabled={remove.isPending}
                        onClick={() => setConfirmId(undefined)}
                      >
                        {t('chat.cancel')}
                      </Button>
                      <Button
                        variant="secondary"
                        className={styles.danger}
                        loading={remove.isPending}
                        onClick={() =>
                          remove.mutate(item.conversationId, {
                            onSuccess: () => setConfirmId(undefined),
                          })
                        }
                      >
                        {t('chat.delete')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link
                      className={styles.historyLink}
                      to={`/chat/${item.conversationId}`}
                    >
                      <span className={styles.historyTitle}>
                        {item.title ?? t('chat.untitled')}
                      </span>
                      <span className={styles.historyTime}>
                        {formatTime(item.updatedAt, currentLanguage())}
                      </span>
                    </Link>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => {
                        remove.reset()
                        setConfirmId(item.conversationId)
                      }}
                    >
                      {t('chat.delete')}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {remove.isError && (
          <FormError message={errorMessage(t, remove.error)} />
        )}
        {conversations.hasNextPage && (
          <Button
            variant="secondary"
            loading={conversations.isFetchingNextPage}
            onClick={() => void conversations.fetchNextPage()}
          >
            {t('chat.loadMore')}
          </Button>
        )}
      </main>
    </div>
  )
}
