import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate } from '@/shared/i18n/format'
import { ButtonLink } from '@/shared/ui/button'
import { DocumentStatus } from '@/shared/ui/document'
import { Card, FormError, Notice, Section, Stack, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { SwitchField } from '@/shared/ui/switch-field'
import type { BillTranslation } from '../api'
import {
  billDaysLeft,
  billErrorMessage,
  billGuidePath,
  billTranslationPath,
} from '../bill-translation'
import { useBill, useBillReminder } from '../use-bill-translations'
import styles from './bill.module.css'

export function BillResult({ memberId, id }: { memberId: number; id: number }) {
  const { t } = useTranslation()
  const query = useBill(memberId, id)
  return (
    <QueryState
      query={query}
      formatError={(error) => billErrorMessage(t, error)}
    >
      {query.data && (
        <ResultDetails memberId={memberId} id={id} result={query.data} />
      )}
    </QueryState>
  )
}

function ResultDetails({
  memberId,
  id,
  result,
}: {
  memberId: number
  id: number
  result: BillTranslation
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const reminder = useBillReminder(memberId, id)
  const date = result.dueDate
    ? formatCalendarDate(result.dueDate, language)
    : null
  const days = result.dueDate ? billDaysLeft(result.dueDate) : null
  const dDay =
    days === null
      ? null
      : days === 0
        ? t('bill.today')
        : days < 0
          ? t('bill.overdue')
          : `D-${days}`
  const amount =
    result.amount === null
      ? null
      : new Intl.NumberFormat(language, {
          style: 'currency',
          currency: 'KRW',
        }).format(result.amount)
  const unknown = t('bill.unknown')
  const paymentMethods = result.paymentMethods.filter(
    (method) => method.trim() !== result.summary?.howToPay?.trim(),
  )
  const rows = [
    { key: 'what', summary: result.summary?.what, value: result.taxType },
    { key: 'due', summary: result.summary?.due, value: date },
    { key: 'amount', summary: result.summary?.amount, value: amount },
    { key: 'how', summary: result.summary?.howToPay, value: null },
  ]

  return (
    <Stack>
      <DocumentStatus
        tone="success"
        label={t(`bill.type.${result.documentType ?? 'OTHER'}`)}
      >
        {result.issuer && <p lang="ko">{result.issuer}</p>}
      </DocumentStatus>
      {result.firstPageOnly && (
        <Notice tone="note">{t('bill.firstPage')}</Notice>
      )}
      <Card>
        <dl className={styles.facts}>
          {rows.map(({ key, summary, value }) => (
            <div key={key}>
              <dt>{t(`bill.${key}`)}</dt>
              <dd>
                {value && (
                  <strong lang={key === 'what' ? 'ko' : undefined}>
                    {value}
                  </strong>
                )}
                {key === 'due' && dDay && (
                  <Tag tone={days !== null && days < 0 ? 'danger' : 'main'}>
                    {dDay}
                  </Tag>
                )}
                {summary && <p lang={result.language}>{summary}</p>}
                {key === 'how' && paymentMethods.length > 0 && (
                  <ul className={styles.list} lang={result.language}>
                    {paymentMethods.map((method, index) => (
                      <li key={index}>{method}</li>
                    ))}
                  </ul>
                )}
                {!summary &&
                  !value &&
                  (key !== 'how' || !paymentMethods.length) &&
                  unknown}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Notice tone="note" title={t('bill.warnings')}>
        <p>{t('bill.disclaimer')}</p>
        {result.warnings.length > 0 && (
          <ul className={styles.list} lang={result.language}>
            {result.warnings.map(({ code, message }, index) => (
              <li key={`${code}-${index}`}>{message}</li>
            ))}
          </ul>
        )}
      </Notice>
      {result.originalLines.length > 0 && (
        <details className={styles.original}>
          <summary>{t('bill.original')}</summary>
          <ul className={styles.list} lang="ko">
            {result.originalLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      {result.relatedGuides.length > 0 && (
        <Section title={t('bill.guides')}>
          <ul className={styles.list}>
            {result.relatedGuides.map((guide) => (
              <li key={guide.code}>
                <Link to={billGuidePath(guide)}>{guide.title}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Card>
        <SwitchField
          label={t('bill.reminder')}
          hint={t(
            days === null || days < 0
              ? 'bill.reminderUnavailable'
              : 'bill.reminderHint',
          )}
          checked={result.reminder}
          disabled={
            reminder.isPending ||
            (!result.reminder && (days === null || days < 0))
          }
          onChange={(event) => reminder.change(event.target.checked)}
        />
        {reminder.isError && (
          <FormError message={billErrorMessage(t, reminder.error)} />
        )}
      </Card>
      <ButtonLink variant="secondary" to="/chat">
        {t('bill.ask')}
      </ButtonLink>
      <ButtonLink to={billTranslationPath}>{t('bill.done')}</ButtonLink>
    </Stack>
  )
}
