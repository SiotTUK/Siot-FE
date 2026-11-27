import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { BillTranslation } from '@/features/bill-translation/api'
import {
  billDDayLabel,
  billErrorMessage,
  billTranslationPath,
  formatBillAmount,
} from '@/features/bill-translation/bill-translation'
import { useBill } from '@/features/bill-translation/use-bill-translations'
import { BillFailureCard } from '@/features/bill-translation/ui/bill-failure'
import { BillProcessingCard } from '@/features/bill-translation/ui/bill-processing-card'
import billStyles from '@/features/bill-translation/ui/bill.module.css'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { formatCalendarDate } from '@/shared/i18n/format'
import { Button, ButtonLink } from '@/shared/ui/button'
import { Card, Muted, Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { ChatBillTurn } from '../use-chat-bill'
import { ChatBubble } from './chat-message'
import styles from './chat.module.css'

// #29 bill translation inside the chat log. `billStyles.theme` gives the shared
// bill parts their colours outside the bill screens.

/** "📷 사진 1장 · 이거 무슨 내용이에요?" The photo itself is not kept. */
function ChatBillQuestion() {
  const { t } = useTranslation()
  return (
    <ChatBubble mine>
      <span aria-hidden="true">📷 </span>
      {t('chat.bill.userCard')}
    </ChatBubble>
  )
}

/** One finished translation, read again from the server by its id. */
export function ChatBillResultTurn({
  memberId,
  translationId,
  conversationPath,
  onLoaded,
}: {
  memberId: number
  translationId: number
  /** Where "‹" of the detail screen returns to. */
  conversationPath: string
  /** The card grew after it was first drawn. */
  onLoaded: () => void
}) {
  const { t } = useTranslation()
  const query = useBill(memberId, translationId)
  // Checked before the data: a cached result may have been deleted since.
  const deleted = query.error instanceof ApiError && query.error.status === 404
  const loaded = deleted || query.data !== undefined
  useEffect(() => {
    if (loaded) onLoaded()
  }, [loaded, onLoaded])
  return (
    <>
      <ChatBillQuestion />
      {deleted ? (
        <ChatBubble answer>{t('chat.bill.deleted')}</ChatBubble>
      ) : (
        <ChatBubble answer>
          <QueryState query={query}>
            {query.data && (
              <ResultSummary
                result={query.data}
                translationId={translationId}
                conversationPath={conversationPath}
              />
            )}
          </QueryState>
        </ChatBubble>
      )}
    </>
  )
}

function ResultSummary({
  result,
  translationId,
  conversationPath,
}: {
  result: BillTranslation
  translationId: number
  conversationPath: string
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const unknown = t('bill.unknown')
  const dDay = billDDayLabel(t, result.dueDate)
  const howToPay =
    result.summary?.howToPay?.trim() ||
    result.paymentMethods.filter((method) => method.trim()).join(', ')
  return (
    <div className={`${billStyles.theme} ${styles.billResult}`}>
      <Stack gap={12}>
        <dl className={billStyles.facts}>
          <div>
            <dt>{t('bill.amount')}</dt>
            <dd>
              <strong>
                {formatBillAmount(result.amount, language) ?? unknown}
              </strong>
            </dd>
          </div>
          <div>
            <dt>{t('bill.due')}</dt>
            <dd>
              <strong>
                {result.dueDate
                  ? formatCalendarDate(result.dueDate, language)
                  : unknown}
              </strong>
              {dDay && <span className={styles.billDDay}>{dDay}</span>}
            </dd>
          </div>
          <div>
            <dt>{t('bill.how')}</dt>
            <dd lang={howToPay ? result.language : undefined}>
              {howToPay || unknown}
            </dd>
          </div>
        </dl>
        <p className={styles.billVerify}>{t('chat.bill.verify')}</p>
        <ButtonLink
          className={billStyles.primary}
          to={`${billTranslationPath}/${translationId}`}
          state={{ from: conversationPath }}
        >
          {t('chat.bill.detail')}
        </ButtonLink>
        <Muted>{t('chat.bill.noContext')}</Muted>
      </Stack>
    </div>
  )
}

/** The upload in progress, or why it ended without a result. */
export function ChatBillPendingTurn({
  turn,
  onCancel,
  onResend,
  onPickAgain,
}: {
  turn: ChatBillTurn
  onCancel: () => void
  /** Sends the same photo again, after consent. */
  onResend: (file: File) => void
  onPickAgain: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <ChatBillQuestion />
      <div className={`${billStyles.theme} ${styles.billPending}`}>
        {turn.step === 'processing' && (
          <BillProcessingCard>
            <Button
              className={billStyles.secondary}
              variant="secondary"
              block
              onClick={onCancel}
            >
              {t('common.cancel')}
            </Button>
          </BillProcessingCard>
        )}
        {turn.step === 'unreadable' && (
          <BillFailureCard result={turn.result} onRetry={onPickAgain} />
        )}
        {turn.step === 'error' && (
          <Card>
            <strong className={billStyles.errorTitle}>
              {t('chat.bill.failed')}
            </strong>
            <p role="alert">{billErrorMessage(t, turn.error)}</p>
            <Button
              className={billStyles.secondary}
              variant="secondary"
              block
              onClick={() => onResend(turn.file)}
            >
              {t('chat.bill.retry')}
            </Button>
          </Card>
        )}
      </div>
    </>
  )
}
