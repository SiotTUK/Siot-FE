import { zodResolver } from '@hookform/resolvers/zod'
import { useDeferredValue, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import {
  CheckField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/shared/ui/field'
import { Card, FormError, Muted, Tag, Toolbar } from '@/shared/ui/page'
import { InfiniteList } from '@/shared/ui/query-state'
import type { ChatReviewResponse, ReviewType } from '../api'
import { reviewKeywordMax, toReviewSearch } from '../review-search'
import { useReviews, useUpdateReview } from '../use-admin'
import styles from './admin.module.css'

/** ADM-08: answers rated unhelpful or without sources. Masked text only. */
export function ReviewList() {
  const { t } = useTranslation()
  const [type, setType] = useState<ReviewType>('ALL')
  const [reviewed, setReviewed] = useState('false')
  const [id, setId] = useState('')
  const [keyword, setKeyword] = useState('')
  const search = toReviewSearch(useDeferredValue(id), useDeferredValue(keyword))
  const badId = id.trim() !== '' && search.messageId === undefined
  const reviews = useReviews(
    type,
    reviewed === '' ? undefined : reviewed === 'true',
    search,
  )

  return (
    <>
      <Toolbar>
        <SelectField
          label={t('admin.reviewType')}
          value={type}
          onChange={(event) => setType(event.target.value as ReviewType)}
          options={[
            { value: 'ALL', label: t('admin.all') },
            { value: 'NEGATIVE', label: t('admin.typeNEGATIVE') },
            { value: 'NO_EVIDENCE', label: t('admin.typeNO_EVIDENCE') },
          ]}
        />
        <SelectField
          label={t('admin.reviewedFilter')}
          value={reviewed}
          onChange={(event) => setReviewed(event.target.value)}
          options={[
            { value: '', label: t('admin.all') },
            { value: 'false', label: t('admin.reviewedFalse') },
            { value: 'true', label: t('admin.reviewedTrue') },
          ]}
        />
      </Toolbar>
      <Toolbar>
        <TextField
          type="search"
          inputMode="numeric"
          label={t('admin.reviewId')}
          placeholder="#32"
          value={id}
          error={badId ? t('admin.reviewIdInvalid') : undefined}
          onChange={(event) => setId(event.target.value)}
        />
        <TextField
          type="search"
          label={t('admin.reviewKeyword')}
          placeholder={t('admin.reviewKeywordPlaceholder')}
          value={keyword}
          maxLength={reviewKeywordMax}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </Toolbar>
      <InfiniteList
        query={reviews}
        empty={t('admin.empty')}
        getKey={(review) => review.messageId}
        renderItem={(review) => <ReviewCard review={review} />}
      />
    </>
  )
}

const reviewSchema = z.object({
  adminMemo: z.string().max(1000),
  reviewed: z.boolean(),
})
type ReviewValues = z.input<typeof reviewSchema>

function ReviewCard({ review }: { review: ChatReviewResponse }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const update = useUpdateReview()
  const { register, handleSubmit } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      adminMemo: review.adminMemo ?? '',
      reviewed: review.reviewed,
    },
  })
  const onSubmit = handleSubmit((values) =>
    update.mutate({
      messageId: review.messageId,
      reviewed: values.reviewed,
      adminMemo: values.adminMemo.trim() || null,
    }),
  )

  return (
    <Card>
      <Toolbar justify="between">
        <Tag tone={review.reason === 'NEGATIVE' ? 'danger' : 'warning'}>
          {t(`admin.type${review.reason}`)}
        </Tag>
        <Muted>
          #{review.messageId} · {review.language} ·{' '}
          {t('admin.answeredAt', {
            date: formatDateTime(review.createdAt, language),
          })}
        </Muted>
      </Toolbar>
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
        <Muted>
          {review.sources
            .map((source) => source.documentName ?? '—')
            .join(' · ')}
        </Muted>
      )}
      <form onSubmit={(event) => void onSubmit(event)}>
        <TextAreaField
          {...register('adminMemo')}
          label={t('admin.memo')}
          rows={2}
          maxLength={1000}
        />
        <Toolbar justify="between">
          <CheckField
            {...register('reviewed')}
            label={t('admin.markReviewed')}
          />
          <Button type="submit" variant="secondary" loading={update.isPending}>
            {t(update.isSuccess ? 'admin.saved' : 'admin.save')}
          </Button>
        </Toolbar>
        {update.isError && (
          <FormError message={errorMessage(t, update.error)} />
        )}
      </form>
      {review.reviewedAt && (
        <Muted>
          {t('admin.reviewedAt', {
            date: formatDateTime(review.reviewedAt, language),
          })}
        </Muted>
      )}
    </Card>
  )
}
