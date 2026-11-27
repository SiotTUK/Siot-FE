import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TaxDetailLink } from '@/features/calendar/ui/tax-detail-link'
import { useChecklist } from '@/features/checklist/use-checklist'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate } from '@/shared/i18n/format'
import { ButtonLink } from '@/shared/ui/button'
import {
  Card,
  FormError,
  Muted,
  Notice,
  Section,
  Stack,
} from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { SwitchField } from '@/shared/ui/switch-field'
import type { BillTranslation } from '../api'
import {
  billDaysLeft,
  billDDayLabel,
  billErrorMessage,
  billGuidePath,
  billTranslationPath,
  formatBillAmount,
  visibleBillGuides,
} from '../bill-translation'
import { useBill, useBillReminder } from '../use-bill-translations'
import styles from './bill.module.css'

export function BillResult({ memberId, id }: { memberId: number; id: number }) {
  const query = useBill(memberId, id)
  return (
    <QueryState query={query}>
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
  const checklist = useChecklist(memberId, language)
  const guides = visibleBillGuides(result.relatedGuides, checklist.data?.items)
  const date = result.dueDate
    ? formatCalendarDate(result.dueDate, language)
    : null
  const days = result.dueDate ? billDaysLeft(result.dueDate) : null
  const dDay = billDDayLabel(t, result.dueDate)
  const amount = formatBillAmount(result.amount, language)
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
      <section className={styles.hero}>
        <p>{t(`bill.type.${result.documentType ?? 'OTHER'}`)}</p>
        <h2>{date ? t('bill.payBy', { date }) : t('bill.dueUnclear')}</h2>
        {dDay && <p className={styles.countdown}>{dDay}</p>}
        {result.issuer && <p lang="ko">{result.issuer}</p>}
      </section>
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
      {/* CAL-03: the round the due date falls in, else one by tax kind. */}
      <TaxDetailLink
        taxKind={result.taxKind}
        scheduleId={result.taxScheduleId}
      />
      <Notice tone="note" title={t('bill.verifyOriginal')}>
        <p>{t('bill.disclaimer')}</p>
        {result.warnings.length > 0 && (
          <>
            <strong>{t('bill.warnings')}</strong>
            <ul className={styles.list} lang={result.language}>
              {result.warnings.map(({ code, message }, index) => (
                <li key={`${code}-${index}`}>{message}</li>
              ))}
            </ul>
          </>
        )}
      </Notice>
      {result.originalLines.length > 0 && (
        <details className={styles.disclosure}>
          <summary>{t('bill.original')}</summary>
          <ul className={styles.list} lang="ko">
            {result.originalLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      {guides.length > 0 && (
        <Section title={t('bill.guides')}>
          <ul className={styles.list}>
            {guides.map((guide) => (
              <li key={guide.code}>
                <Link to={billGuidePath(guide)}>{guide.title}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title={t('bill.reminderSchedule')}>
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
          <ul className={styles.schedule}>
            <li>{t('bill.reminderSeven')}</li>
            <li>{t('bill.reminderOne')}</li>
          </ul>
          {reminder.isError && (
            <FormError message={billErrorMessage(t, reminder.error)} />
          )}
        </Card>
      </Section>
      <ButtonLink className={styles.secondary} variant="secondary" to="/chat">
        {t('bill.ask')}
      </ButtonLink>
      <Stack gap={8}>
        <ButtonLink className={styles.primary} to={billTranslationPath}>
          {t('bill.done')}
        </ButtonLink>
        {result.id !== null && <Muted>{t('bill.saved')}</Muted>}
      </Stack>
      <Notice tone="note" title={t('bill.privacyTitle')}>
        {t('bill.storageNotice')}
      </Notice>
    </Stack>
  )
}
