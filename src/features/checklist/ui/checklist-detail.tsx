import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { chatEntryState } from '@/features/chat/chat-entry'
import { currentLanguage } from '@/shared/i18n'
import { formatMonthDay } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Tag } from '@/shared/ui/page'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'
import type { ChecklistItemResponse } from '../api'
import { deadlineText } from '../checklist'
import { ChecklistReport } from './checklist-report'
import styles from './checklist-detail.module.css'

export function ChecklistDetail({
  item,
  memberId,
  busy,
  onToggleDone,
}: {
  item: ChecklistItemResponse
  memberId: number
  busy?: boolean
  onToggleDone?: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = currentLanguage()
  const [copied, setCopied] = useState(false)

  const overdue = item.status === 'OVERDUE'
  const isDone = item.status === 'DONE'
  const dDayText = deadlineText(item, t('checklist.pastDeadline'))

  const handleShare = async () => {
    const shareData = {
      title: item.title,
      text: item.summary || item.title,
      url: window.location.href,
    }
    if (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyFallback()
        }
      }
    } else {
      copyFallback()
    }
  }

  const copyFallback = () => {
    if (!navigator.clipboard?.writeText) return
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  const noticeDate = item.noticeChangedAt
    ? formatMonthDay(item.noticeChangedAt.slice(0, 10), language)
    : ''

  return (
    <>
      <ScreenHeader
        back={{ label: t('common.back'), to: '/home' }}
        title={t('checklist.detail.screenTitle')}
        actions={
          <HeaderAction onClick={() => void handleShare()}>
            {t('checklist.detail.share')}
          </HeaderAction>
        }
      />

      <PageBody className={styles.container}>
        {item.hasNoticeChanged && (
          <div className={styles.noticeBanner} role="status">
            <span className={styles.noticeIcon} aria-hidden="true">
              🔔
            </span>
            <span>
              {noticeDate
                ? t('checklist.detail.noticeChangedWithDate', {
                    date: noticeDate,
                  })
                : t('checklist.detail.noticeChanged')}
            </span>
          </div>
        )}

        <section className={styles.headerCard}>
          <div className={styles.tags}>
            {item.itemType === 'REQUIRED' && (
              <Tag tone="main">{t('checklist.detail.required')}</Tag>
            )}
            {item.badge && <Tag>{item.badge}</Tag>}
            {dDayText && (
              <span className={styles.dDay} data-overdue={overdue}>
                {dDayText}
              </span>
            )}
            {isDone && <Tag tone="main">{t('checklist.done')}</Tag>}
          </div>

          <h1 className={styles.title}>{item.title}</h1>

          {item.summary && <p className={styles.summary}>{item.summary}</p>}

          {item.content && <p className={styles.content}>{item.content}</p>}

          {item.variantBodies.map((body, index) => (
            <p key={`${body}-${index}`} className={styles.variantText}>
              {body}
            </p>
          ))}

          {overdue && (
            <p className={styles.overdueNotice} role="note">
              {t('checklist.overdue')}
            </p>
          )}

          {item.warning && item.warningMessage && (
            <p className={styles.warningNotice} role="note">
              {item.warningMessage}
            </p>
          )}
        </section>

        <dl className={styles.facts}>
          {(item.deadline || dDayText || item.applyStartsOn) && (
            <div>
              <dt>{t('checklist.detail.deadline')}</dt>
              <dd>
                {item.deadline
                  ? `${formatMonthDay(item.deadline, language)} (${dDayText ?? ''})`
                  : (dDayText ?? '')}
              </dd>
              {item.applyStartsOn && (
                <dd className={styles.applyStarts}>
                  {t('checklist.applyStarts', {
                    date: formatMonthDay(item.applyStartsOn, language),
                  })}
                </dd>
              )}
            </div>
          )}

          {item.place && (
            <div>
              <dt>{t('checklist.detail.place')}</dt>
              <dd>{item.place}</dd>
              <dd>
                <a
                  href={`https://map.kakao.com/?q=${encodeURIComponent(item.place)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkText}
                >
                  {t('checklist.detail.findWay')} ↗
                </a>
              </dd>
            </div>
          )}

          {item.docs && item.docs.length > 0 && (
            <div>
              <dt>{t('checklist.detail.docs')}</dt>
              <dd>
                <ul className={styles.docList}>
                  {item.docs.map((doc, index) => (
                    <li key={`${doc}-${index}`}>{doc}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {item.fee && (
            <div>
              <dt>{t('checklist.detail.fee')}</dt>
              <dd>{item.fee}</dd>
            </div>
          )}

          {item.law && (
            <div>
              <dt>{t('checklist.detail.law')}</dt>
              <dd>{item.law}</dd>
            </div>
          )}

          {item.penalty && (
            <div>
              <dt>{t('checklist.detail.penalty')}</dt>
              <dd className={styles.penaltyText}>{item.penalty}</dd>
            </div>
          )}

          {item.contact && (
            <div>
              <dt>{t('checklist.detail.contact')}</dt>
              <dd>
                <a
                  href={`tel:${item.contact.replace(/[^0-9+]/g, '')}`}
                  className={styles.telLink}
                >
                  ☎ {item.contact}
                </a>
              </dd>
            </div>
          )}

          {item.sourceUrl && (
            <div>
              <dt>{t('checklist.detail.source')}</dt>
              <dd>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkText}
                >
                  {item.sourceName || t('checklist.detail.sourceLink')} ↗
                </a>
                {item.sourcePages && (
                  <span className={styles.sourcePages}>
                    {' '}
                    ({item.sourcePages})
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {item.sourceUrl && (
          <div className={styles.sourceBox}>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
            >
              {item.sourceName || t('checklist.detail.sourceLink')} ↗
            </a>
          </div>
        )}

        <div className={styles.bottomActions}>
          <ChecklistReport item={item} memberId={memberId} />

          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              onClick={() =>
                navigate('/chat', {
                  // CB-06: a draft the member edits and sends; back returns here.
                  state: chatEntryState(
                    { type: 'checklist', id: item.code },
                    t('checklist.detail.askDraft', { title: item.title }),
                  ),
                })
              }
            >
              {t('checklist.detail.askChat')}
            </Button>

            {onToggleDone && (
              <Button
                variant={isDone ? 'secondary' : 'primary'}
                disabled={busy}
                onClick={onToggleDone}
              >
                {t(
                  isDone
                    ? 'checklist.detail.undoDone'
                    : 'checklist.detail.markDone',
                )}
              </Button>
            )}
          </div>
        </div>
      </PageBody>

      {copied && (
        <div role="status" className={styles.toast}>
          {t('checklist.detail.linkCopied')}
        </div>
      )}
    </>
  )
}
