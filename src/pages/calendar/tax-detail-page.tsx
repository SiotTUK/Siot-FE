import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { dDayLabel, httpUrl } from '@/features/calendar/calendar'
import { useTaxDetail } from '@/features/calendar/use-taxes'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate } from '@/shared/i18n/format'
import { useDocumentTitle } from '@/shared/lib/document-title'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { ScreenHeader } from '@/shared/ui/screen-header'
import styles from './tax-detail-page.module.css'

type Source = 'tax' | 'schedule'

/**
 * CAL-03 세금 상세 (GET /api/schedules/taxes/{id}). Opened from a calendar
 * schedule's `taxScheduleId`, a tax rule (BE #29) or a translated tax bill.
 * Rows without a value are hidden, the contact too.
 */
export function TaxDetailPage() {
  return <DetailPage source="tax" />
}

/**
 * CAL-03 일정 상세 (GET /api/schedules/{id}, #34): a common schedule that is
 * not a tax. Same response and layout as the tax detail.
 */
export function ScheduleDetailPage() {
  return <DetailPage source="schedule" />
}

function DetailPage({ source }: { source: Source }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // First screen of this tab (a new tab from a notification, a typed or
  // bookmarked address): there is no previous screen, so go to the calendar.
  const opened = useLocation().key === 'default'
  const id = Number(useParams().scheduleId)
  const valid = Number.isSafeInteger(id) && id > 0

  return (
    <>
      <ScreenHeader
        title={t(`calendar.${source}.screenTitle`)}
        back={{
          label: t('common.back'),
          onClick: () =>
            void (opened
              ? navigate('/calendar', { replace: true })
              : navigate(-1)),
        }}
      />
      <PageBody className={styles.body}>
        {valid ? (
          <TaxDetail scheduleId={id} source={source} />
        ) : (
          <Muted>{t(`calendar.${source}.notFound`)}</Muted>
        )}
      </PageBody>
    </>
  )
}

function TaxDetail({
  scheduleId,
  source,
}: {
  scheduleId: number
  source: Source
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const query = useTaxDetail(scheduleId, language, source)
  useDocumentTitle(query.data?.title, t(`calendar.${source}.screenTitle`))
  if (query.error instanceof ApiError && query.error.status === 404)
    return <Muted>{t(`calendar.${source}.notFound`)}</Muted>

  const tax = query.data
  const start = tax && formatCalendarDate(tax.startsOn, language)
  const end = tax?.endsOn && formatCalendarDate(tax.endsOn, language)
  const dDay = dDayLabel(t, tax?.dDay)
  const link = httpUrl(tax?.sourceUrl)

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
            <Fact label={t(`calendar.${source}.period`)}>
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
            {/* Page numbers alone are not a law: hide the row without law text. */}
            {tax.law && (
              <Fact label={t('calendar.tax.law')}>
                {tax.law}
                {tax.sourcePages && (
                  <span className={styles.pages}>
                    {' '}
                    {t('calendar.tax.sourcePages', { pages: tax.sourcePages })}
                  </span>
                )}
              </Fact>
            )}
            <Fact label={t('calendar.tax.contact')}>{tax.contact}</Fact>
          </dl>
          {tax.content && <p className={styles.content}>{tax.content}</p>}
          {link && (
            <a
              className={styles.pay}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(source === 'tax' ? 'calendar.tax.pay' : 'calendar.sourceLink')}{' '}
              ↗
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
