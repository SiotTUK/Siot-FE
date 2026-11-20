import type {
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PageResponse } from '../api/types'
import { errorMessage } from '../i18n/error-message'
import { Button } from './button'
import { PageLoader } from './mobile-frame'
import { FormError, Muted, Stack } from './page'

type QueryLike = {
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error: unknown
  refetch: () => unknown
}

/** Loading → error with retry → content. Shared by every screen that reads data. */
export function QueryState({
  query,
  children,
}: {
  query: QueryLike
  children: ReactNode
}) {
  const { t } = useTranslation()
  if (query.isPending) return <PageLoader label={t('common.loading')} />
  if (query.isError)
    return (
      <Stack gap={12}>
        <FormError message={errorMessage(t, query.error)} />
        <Button
          variant="secondary"
          loading={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t('common.retry')}
        </Button>
      </Stack>
    )
  return children
}

/** Paged list (page/size/hasNext responses) with empty state and "더 보기". */
export function InfiniteList<T>({
  query,
  empty,
  getKey,
  renderItem,
}: {
  query: UseInfiniteQueryResult<InfiniteData<PageResponse<T>>>
  empty: string
  getKey: (item: T) => string | number
  renderItem: (item: T) => ReactNode
}) {
  const { t } = useTranslation()
  const items = query.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <QueryState query={query}>
      {items.length === 0 ? (
        <Muted>{empty}</Muted>
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
