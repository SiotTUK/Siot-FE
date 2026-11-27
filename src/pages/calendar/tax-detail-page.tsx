import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useTaxDetail } from '@/features/calendar/use-taxes'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate } from '@/shared/i18n/format'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { ScreenHeader } from '@/shared/ui/screen-header'
import styles from './tax-detail-page.module.css'

/**
 * CAL-03 세금 상세 (GET /api/schedules/taxes/{id}). Opened from a calendar
 * schedule's `taxScheduleId` or a tax rule (BE #29). Rows without a value are
 * hidden, the contact too.
 */
export function TaxDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const id = Number(useParams().scheduleId)
  const valid = Number.isSafeInteger(id) && id > 0

  return (
    <>
      <ScreenHeader
        title={t('calendar.tax.screenTitle')}
        back={{ label: t('common.back'), onClick: () => void navigate(-1) }}
      />
      <PageBody className={styles.body}>
        {valid ? (
          <TaxDetail scheduleId={id} />
        ) : (
          <Muted>{t('calendar.tax.notFound')}</Muted>
        )}
      </PageBody>
    </>
  )
}

function TaxDetail({ scheduleId }: { scheduleId: number }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const query = useTaxDetail(scheduleId, language)
  if (query.error instanceof ApiError && query.error.status === 404)
    return <Muted>{t('calendar.tax.notFound')}</Muted>

  const tax = query.data
  const start = tax && formatCalendarDate(tax.startsOn, language)
  const end = tax?.endsOn && formatCalendarDate(tax.endsOn, language)
  const dDay =
    tax?.dDay == null
      ? null
      : tax.dDay < 0
        ? t('calendar.tax.past')
        : tax.dDay === 0
          ? t('calendar.tax.dDayToday')
          : t('calendar.tax.dDay', { count: tax.dDay })

  return (
    <QueryState query={query}>
      {tax && (
        <>
          <div className={styles.hero}>
            {dDay && (
              <Tag
                tone={tax.dDay !== null && tax.dDay < 0 ? 'danger' : 'warning'}
              >
                {dDay}
              </Tag>
            )}
            <h2>{tax.title}</h2>
            {tax.summary && <p>{tax.summary}</p>}
          </div>
          <dl className={styles.facts}>
            <Fact label={t('calendar.tax.period')}>
              {end && end !== start
                ? t('calendar.period', { start, end })
                : start}
            </Fact>
            <Fact label={t('calendar.tax.target')}>
              {tax.targetDescription}
            </Fact>
            <Fact label={t('calendar.tax.place')}>{tax.place}</Fact>
            <Fact label={t('calendar.tax.docs')}>
              {tax.docs?.length ? tax.docs.join(', ') : null}
            </Fact>
            <Fact label={t('calendar.tax.fee')}>{tax.fee}</Fact>
            <Fact label={t('calendar.tax.penalty')}>{tax.penalty}</Fact>
            <Fact label={t('calendar.tax.law')}>
              {tax.law}
              {tax.law && tax.sourcePages && (
                <span className={styles.pages}>
                  {' '}
                  {t('calendar.tax.sourcePages', { pages: tax.sourcePages })}
                </span>
              )}
            </Fact>
            <Fact label={t('calendar.tax.contact')}>{tax.contact}</Fact>
          </dl>
          {tax.content && <p className={styles.content}>{tax.content}</p>}
          {tax.sourceUrl && (
            <a
              className={styles.pay}
              href={tax.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('calendar.tax.pay')} ↗
            </a>
          )}
        </>
      )}
    </QueryState>
  )
}

/** A label and value; hidden when the server sent no value. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '')
    return null
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
