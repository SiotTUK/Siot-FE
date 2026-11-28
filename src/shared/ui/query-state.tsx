import type {
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PageResponse } from '../api/types'
import { currentLanguage } from '../i18n'
import { errorKey, errorMessage } from '../i18n/error-message'
import { Button } from './button'
import { PageLoader } from './mobile-frame'
import { Muted, Stack } from './page'
import { lastUpdatedText } from './query-state-meta'
import { StatusCard } from './status-card'

type QueryLike = {
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error: unknown
  dataUpdatedAt?: number
  refetch: () => unknown
}

/**
 * Loading → error with retry → content. Shared by every screen that reads
 * data. The error is the Figma v2 M13 card: "연결이 잠깐 끊겼어요" when the
 * network is down, otherwise the server's message under a generic title, plus
 * the last-loaded time (Korea time) when prior data exists (#36).
 */
export function QueryState({
  query,
  children,
  keepContentOnError = false,
}: {
  query: QueryLike
  children: ReactNode
  keepContentOnError?: boolean
}) {
  const { t } = useTranslation()
  if (query.isPending) return <PageLoader label={t('common.loading')} />
  const offline = query.isError && errorKey(query.error) === 'errors.NETWORK'
  const updated = query.isError
    ? lastUpdatedText(t, query.dataUpdatedAt, currentLanguage())
    : undefined
  const error = query.isError ? (
    <StatusCard
      role="alert"
      mascot="toro"
      title={t(offline ? 'common.connectionLost' : 'common.loadFailed')}
      description={errorMessage(t, query.error)}
      meta={updated}
      action={
        <Button
          variant="secondary"
          loading={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t('common.retry')}
        </Button>
      }
    />
  ) : null
  if (!keepContentOnError && error) return error
  return (
    <>
      {error}
      {children}
    </>
  )
}

/** Paged list (page/size/hasNext responses) with empty state and "더 보기". */
export function InfiniteList<T>({
  query,
  empty,
  getKey,
  renderItem,
}: {
  query: UseInfiniteQueryResult<InfiniteData<PageResponse<T>>>
  /** Text, or a whole empty screen (Figma v2 M13 EmptyState). */
  empty: ReactNode
  getKey: (item: T) => string | number
  renderItem: (item: T) => ReactNode
}) {
  const { t } = useTranslation()
  const items = query.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <QueryState query={query} keepContentOnError={items.length > 0}>
      {items.length === 0 ? (
        typeof empty === 'string' ? (
          <Muted>{empty}</Muted>
        ) : (
          empty
        )
      ) : (
        <Stack as="ul" gap={10}>
          {items.map((item) => (
            <li key={getKey(item)}>{renderItem(item)}</li>
          ))}
        </Stack>
      )}
      {query.hasNextPage && (
        <Button
          variant="secondary"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t('common.loadMore')}
        </Button>
      )}
    </QueryState>
  )
}
