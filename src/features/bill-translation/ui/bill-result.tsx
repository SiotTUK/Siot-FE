import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TaxDetailLink } from '@/features/calendar/ui/tax-detail-link'
import { useChecklist } from '@/features/checklist/use-checklist'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate } from '@/shared/i18n/format'
import { ButtonLink } from '@/shared/ui/button'
import { InfoIcon } from '@/shared/ui/icons'
import { MascotImage } from '@/shared/ui/mascot-image'
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
  billAmountLine,
  billDueLine,
  billErrorMessage,
  billGuidePath,
  billTranslationPath,
  formatBillAmount,
  sameBillName,
  trimBillParentheses,
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
  // No due date, or it has passed: the reminder cannot be turned on.
  const unavailable = !result.reminder && (days === null || days < 0)
  const amount = formatBillAmount(result.amount, language)
  const unknown = t('bill.unknown')
  const howToPay =
    result.summary && trimBillParentheses(result.summary.howToPay)
  const paymentMethods = result.paymentMethods
    .map(trimBillParentheses)
    .filter((method) => !howToPay || !sameBillName(method, howToPay))
  const rows = [
    // The value is the Korean tax name, so this line is its translation.
    { key: 'what', summary: result.summary?.what, value: result.taxType },
    {
      key: 'due',
      summary: billDueLine(result.summary?.due, result.dueDate),
      value: date,
    },
    {
      key: 'amount',
      summary: billAmountLine(result.summary?.amount, result.amount),
      value: amount,
    },
    { key: 'how', summary: howToPay, value: null },
  ]

  return (
    <Stack>
      <section className={`${styles.hero} ${styles.resultHero}`}>
        <div className={styles.heroText}>
          <p>{t(`bill.type.${result.documentType ?? 'OTHER'}`)}</p>
          <h2>{date ? t('bill.payBy', { date }) : t('bill.dueUnclear')}</h2>
          {(dDay || result.issuer) && (
            <p className={styles.chips}>
              {dDay && (
                <span
                  className={
                    days !== null && days < 0 ? styles.overdue : undefined
                  }
                >
                  {dDay}
                </span>
              )}
              {result.issuer && <span lang="ko">{result.issuer}</span>}
            </p>
          )}
        </div>
        <MascotImage pose="toroStand" height={96} />
      </section>
      {result.firstPageOnly && (
        <Notice tone="note">{t('bill.firstPage')}</Notice>
      )}
      <div className={styles.factCard}>
        <dl className={styles.factTable}>
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
      </div>
      {/* CAL-03: the round the due date falls in, else one by tax kind. */}
      <TaxDetailLink
        taxKind={result.taxKind}
        scheduleId={result.taxScheduleId}
      />
      <section className={styles.check} aria-label={t('bill.verifyOriginal')}>
        <InfoIcon />
        <div>
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
        </div>
      </section>
      {result.originalLines.length > 0 && (
        <Section title={t('bill.original')}>
          <ul className={styles.lines} lang="ko">
            {result.originalLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </Section>
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
          <div
            className={styles.reminder}
            data-locked={unavailable || undefined}
          >
            <SwitchField
              label={t('bill.reminder')}
              hint={t(
                days === null || days < 0
                  ? 'bill.reminderUnavailable'
                  : 'bill.reminderHint',
              )}
              checked={result.reminder}
              disabled={reminder.isPending || unavailable}
              onChange={(event) => reminder.change(event.target.checked)}
            />
            <ul className={styles.schedule}>
              <li>{t('bill.reminderSeven')}</li>
              <li>{t('bill.reminderOne')}</li>
            </ul>
          </div>
          {reminder.isError && (
            <FormError message={billErrorMessage(t, reminder.error)} />
          )}
        </Card>
      </Section>
      <Stack gap={8}>
        <div className={styles.actions}>
          <ButtonLink
            className={styles.secondary}
            variant="secondary"
            to="/chat"
          >
            {t('bill.ask')}
          </ButtonLink>
          <ButtonLink className={styles.primary} to={billTranslationPath}>
            {t('bill.done')}
          </ButtonLink>
        </div>
        {result.id !== null && <Muted>{t('bill.saved')}</Muted>}
      </Stack>
      <Notice tone="note" title={t('bill.privacyTitle')}>
        {t('bill.storageNotice')}
      </Notice>
    </Stack>
  )
}
