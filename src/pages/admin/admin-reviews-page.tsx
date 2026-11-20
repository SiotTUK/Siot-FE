import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChatReviewResponse, ReviewType } from '@/features/admin/api'
import { useReviews, useUpdateReview } from '@/features/admin/use-admin'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { PageLoader } from '@/shared/ui/mobile-frame'
import { FormError } from '@/shared/ui/page'
import { AdminScreen } from './admin-layout'
import styles from './admin.module.css'

const memoMaxLength = 1000

/** ADM-08: answers rated unhelpful or without sources. Masked text only. */
export function AdminReviewsPage() {
  const { t } = useTranslation()
  const [type, setType] = useState<ReviewType>('ALL')
  const [reviewed, setReviewed] = useState<'' | 'false' | 'true'>('false')
  const reviewedValue = reviewed === '' ? undefined : reviewed === 'true'
  const reviews = useReviews(type, reviewedValue)
  const items = reviews.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <AdminScreen title={t('admin.menuReviews')} backTo="/admin">
      <div className={styles.filters}>
        <label className={styles.filterField}>
          <span>{t('admin.reviewType')}</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ReviewType)}
          >
            <option value="ALL">{t('admin.all')}</option>
            <option value="NEGATIVE">{t('admin.typeNEGATIVE')}</option>
            <option value="NO_EVIDENCE">{t('admin.typeNO_EVIDENCE')}</option>
          </select>
        </label>
        <label className={styles.filterField}>
          <span>{t('admin.reviewedFilter')}</span>
          <select
            value={reviewed}
            onChange={(event) =>
              setReviewed(event.target.value as '' | 'false' | 'true')
            }
          >
            <option value="">{t('admin.all')}</option>
            <option value="false">{t('admin.reviewedFalse')}</option>
            <option value="true">{t('admin.reviewedTrue')}</option>
          </select>
        </label>
      </div>

      {reviews.isPending ? (
        <PageLoader label={t('common.loading')} />
      ) : reviews.isError ? (
        <FormError message={errorMessage(t, reviews.error)} />
      ) : items.length === 0 ? (
        <p className={styles.empty}>{t('admin.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((review) => (
            <ReviewCard key={review.messageId} review={review} />
          ))}
        </ul>
      )}
      {reviews.hasNextPage && (
        <Button
          variant="secondary"
          loading={reviews.isFetchingNextPage}
          onClick={() => void reviews.fetchNextPage()}
        >
          {t('admin.loadMore')}
        </Button>
      )}
    </AdminScreen>
  )
}

function ReviewCard({ review }: { review: ChatReviewResponse }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const [memo, setMemo] = useState(review.adminMemo ?? '')
  const [done, setDone] = useState(review.reviewed)
  const update = useUpdateReview()

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.tag} data-reason={review.reason}>
          {t(`admin.type${review.reason}`)}
        </span>
        <span className={styles.muted}>
          {review.language} ·{' '}
          {t('admin.answeredAt', {
            date: formatDateTime(review.createdAt, language),
          })}
        </span>
      </div>
      <dl className={styles.qa}>
        <dt>{t('admin.question')}</dt>
        <dd>{review.question ?? t('admin.noQuestion')}</dd>
        <dt>{t('admin.answer')}</dt>
        <dd>{review.answer}</dd>
        {review.feedbackComment && (
          <>
            <dt>{t('admin.feedback')}</dt>
            <dd>{review.feedbackComment}</dd>
          </>
        )}
      </dl>
      {review.sources.length > 0 && (
        <p className={styles.muted}>
          {review.sources
            .map((source) => source.documentName ?? '—')
            .join(' · ')}
        </p>
      )}
      <form
        className={styles.reviewForm}
        onSubmit={(event) => {
          event.preventDefault()
          update.mutate({
            messageId: review.messageId,
            reviewed: done,
            adminMemo: memo.trim() || null,
          })
        }}
      >
        <label className={styles.filterField}>
          <span>{t('admin.memo')}</span>
          <textarea
            rows={2}
            maxLength={memoMaxLength}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={done}
            onChange={(event) => setDone(event.target.checked)}
          />
          {t('admin.markReviewed')}
        </label>
        <div className={styles.actions}>
          {update.isSuccess && (
            <span className={styles.saved} role="status">
              {t('admin.saved')}
            </span>
          )}
          <Button type="submit" variant="secondary" loading={update.isPending}>
            {t('admin.save')}
          </Button>
        </div>
        {update.isError && (
          <FormError message={errorMessage(t, update.error)} />
        )}
        {review.reviewedAt && (
          <p className={styles.muted}>
            {t('admin.reviewedAt', {
              date: formatDateTime(review.reviewedAt, language),
            })}
          </p>
        )}
      </form>
    </li>
  )
}
