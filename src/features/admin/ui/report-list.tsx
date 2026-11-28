import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { currentLanguage, languages } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { SelectField, TextAreaField } from '@/shared/ui/field'
import {
  Card,
  FormError,
  Muted,
  Notice,
  Section,
  Tag,
  Toolbar,
} from '@/shared/ui/page'
import { InfiniteList, QueryState } from '@/shared/ui/query-state'
import {
  reportStatuses,
  reportTargetPath,
  type AdminReport,
  type ReportStatus,
} from '../report-api'
import {
  useAdminReport,
  useAdminReports,
  useUpdateAdminReport,
} from '../use-admin-reports'
import styles from './admin.module.css'

const statusTone = {
  RECEIVED: 'danger',
  IN_REVIEW: 'warning',
  RESOLVED: 'main',
  REJECTED: 'neutral',
} as const

function StatusTag({ status }: { status: ReportStatus }) {
  const { t } = useTranslation()
  return (
    <Tag tone={statusTone[status]}>{t(`admin.reports.statuses.${status}`)}</Tag>
  )
}

/** Event, rule, checklist item ... or "삭제된 대상" when it was removed. */
function targetLabel(t: (key: string) => string, report: AdminReport) {
  return report.targetKind
    ? t(`admin.reports.targetKinds.${report.targetKind}`)
    : t('admin.reports.targetRemoved')
}

/** ADM-07: content error reports, newest first. Opens with new ones. */
export function ReportList() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<ReportStatus | ''>('RECEIVED')
  const reports = useAdminReports(status)
  return (
    <>
      <SelectField
        label={t('admin.reports.status')}
        value={status}
        onChange={(event) => setStatus(event.target.value as ReportStatus | '')}
        options={[
          { value: '', label: t('admin.all') },
          ...reportStatuses.map((value) => ({
            value,
            label: t(`admin.reports.statuses.${value}`),
          })),
        ]}
      />
      <InfiniteList
        query={reports}
        empty={t('admin.empty')}
        getKey={(report) => report.reportId}
        renderItem={(report) => <ReportRow report={report} />}
      />
    </>
  )
}

function ReportRow({ report }: { report: AdminReport }) {
  const { t } = useTranslation()
  return (
    <Link className="plain-link" to={`/admin/reports/${report.reportId}`}>
      <Card>
        <strong>
          {report.targetTitleSnapshot ?? t('admin.reports.untitled')}
        </strong>
        <p className={styles.tags}>
          <StatusTag status={report.status} />
          <Tag>{targetLabel(t, report)}</Tag>
          <Tag>{t(`admin.reports.reasons.${report.reason}`)}</Tag>
        </p>
        {report.quotedText && (
          <p className={styles.quote}>“{report.quotedText}”</p>
        )}
        <Muted>
          #{report.reportId} ·{' '}
          {t('admin.reports.receivedAt', {
            date: formatDateTime(report.createdAt, currentLanguage()),
          })}
        </Muted>
      </Card>
    </Link>
  )
}

/** ADM-07 one report: what was reported, and its status and memo. */
export function ReportDetail({ reportId }: { reportId: number }) {
  const report = useAdminReport(reportId)
  // Kept here: the form restarts from the saved values after a save.
  const update = useUpdateAdminReport(reportId)
  return (
    <QueryState query={report}>
      {report.data && (
        <>
          <ReportSummary report={report.data} />
          <ReportProcessForm
            key={report.data.updatedAt}
            report={report.data}
            update={update}
          />
        </>
      )}
    </QueryState>
  )
}

function ReportSummary({ report }: { report: AdminReport }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const target = reportTargetPath(report)
  return (
    <Card>
      <p className={styles.tags}>
        <StatusTag status={report.status} />
        <Tag>{targetLabel(t, report)}</Tag>
      </p>
      <strong>
        {report.targetTitleSnapshot ?? t('admin.reports.untitled')}
      </strong>
      <dl className={styles.qa}>
        <dt>{t('admin.reports.quotedText')}</dt>
        <dd>{report.quotedText ?? '-'}</dd>
        <dt>{t('admin.reports.reason')}</dt>
        <dd>{t(`admin.reports.reasons.${report.reason}`)}</dd>
        {report.description && (
          <>
            <dt>{t('admin.reports.description')}</dt>
            <dd>{report.description}</dd>
          </>
        )}
        <dt>{t('admin.reports.language')}</dt>
        <dd>{languages[report.language] ?? report.language}</dd>
        <dt>{t('admin.reports.received')}</dt>
        <dd>{formatDateTime(report.createdAt, language)}</dd>
        <dt>{t('admin.reports.reporter')}</dt>
        <dd>
          {report.reporterUserId == null
            ? '-'
            : t('admin.reports.memberId', { id: report.reporterUserId })}
        </dd>
      </dl>
      {target ? (
        <Link className={styles.link} to={target}>
          {t('admin.reports.openTarget')}
        </Link>
      ) : (
        <Muted>{t('admin.reports.targetRemovedHelp')}</Muted>
      )}
    </Card>
  )
}

const processSchema = z.object({
  status: z.enum(reportStatuses),
  adminMemo: z.string().max(2000, 'admin.reports.memoTooLong'),
})
type ProcessValues = z.input<typeof processSchema>

function ReportProcessForm({
  report,
  update,
}: {
  report: AdminReport
  update: ReturnType<typeof useUpdateAdminReport>
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProcessValues>({
    resolver: zodResolver(processSchema),
    defaultValues: { status: report.status, adminMemo: report.adminMemo ?? '' },
  })
  const onSubmit = handleSubmit((values) =>
    update.mutate({
      status: values.status,
      adminMemo: values.adminMemo.trim() || null,
    }),
  )
  const memoError = errors.adminMemo?.message
  return (
    <Section title={t('admin.reports.processTitle')}>
      <form onSubmit={(event) => void onSubmit(event)}>
        <SelectField
          {...register('status')}
          label={t('admin.reports.status')}
          options={reportStatuses.map((value) => ({
            value,
            label: t(`admin.reports.statuses.${value}`),
          }))}
        />
        <TextAreaField
          {...register('adminMemo')}
          label={t('admin.reports.memo')}
          help={t('admin.reports.memoHelp')}
          error={memoError ? t(memoError) : undefined}
          rows={3}
          maxLength={2000}
        />
        <Toolbar justify="end">
          <Button type="submit" variant="secondary" loading={update.isPending}>
            {t('admin.save')}
          </Button>
        </Toolbar>
        <FormError
          message={update.isError ? errorMessage(t, update.error) : undefined}
        />
        {update.isSuccess && !isDirty && (
          <Notice tone="success" title={t('admin.saved')} />
        )}
      </form>
      {report.processedAt && (
        <Muted>
          {t('admin.reports.processedAt', {
            date: formatDateTime(report.processedAt, language),
            id: report.processedBy ?? '-',
          })}
        </Muted>
      )}
    </Section>
  )
}
