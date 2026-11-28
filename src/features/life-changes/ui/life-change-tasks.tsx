import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { chatBackPath } from '@/shared/lib/chat-back'
import type { ChecklistItemResponse } from '@/features/checklist/api'
import {
  checklistItemKey,
  deadlineText,
  markErrorMessage,
  nextMark,
  reasonLine,
} from '@/features/checklist/checklist'
import { TaskRow } from '@/features/checklist/ui/task-row'
import {
  useChecklist,
  useMarkChecklistItem,
} from '@/features/checklist/use-checklist'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatLongMonthDay } from '@/shared/i18n/format'
import { Button, ButtonLink } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { MascotImage } from '@/shared/ui/mascot-image'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { BottomArea, FormError, Muted, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'
import {
  relatedLifeChangeTasks,
  splitLifeChangeTasks,
  type LifeChangeCode,
} from '../life-changes'
import { useChangeLifeChange, useLifeChanges } from '../use-life-changes'
import styles from './life-changes.module.css'

type MarkAction = 'toggleDone' | 'toggleNotApplicable'

/**
 * Figma v2 F06b 생활 변화 · 할 일: date and progress, the most urgent task
 * on a "먼저 하세요" card, the rest under "함께 챙길 일". "수정" goes back to
 * F06a with this change chosen; deleting the record stays at the bottom.
 */
export function LifeChangeTasks({
  memberId,
  code,
}: {
  memberId: number
  code: LifeChangeCode
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const chat = chatBackPath(state)
  const changes = useLifeChanges(memberId)
  const mutation = useChangeLifeChange(memberId, code)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const existing = changes.data?.find((entry) => entry.lifeChangeCode === code)
  const edit = `/home/life-changes?code=${code}`
  const deleting = mutation.isPending || mutation.isSuccess

  // Not registered (an old link): choose the date on F06a first.
  if (changes.data && !existing && !deleting)
    return <Navigate to={edit} replace state={state} />

  return (
    <>
      <ScreenHeader
        title={t(`lifeChanges.types.${code}.title`)}
        back={
          chat
            ? { label: t('common.back'), to: chat }
            : { label: t('lifeChanges.backHome'), to: '/home' }
        }
        actions={
          <HeaderAction to={edit} state={state}>
            {t('lifeChanges.edit')}
          </HeaderAction>
        }
      />
      <PageBody className={styles.taskPage}>
        <QueryState query={changes} keepContentOnError={changes.isRefetchError}>
          {existing && (
            <TaskOverview
              memberId={memberId}
              code={code}
              baseDate={existing.baseDate}
              busy={mutation.isPending}
              chat={chat}
            />
          )}
          {mutation.isError && (
            <FormError message={errorMessage(t, mutation.error)} />
          )}
          {confirmDelete ? (
            <ConfirmPanel
              message={t('lifeChanges.confirmDelete')}
              confirmLabel={t('lifeChanges.delete')}
              cancelLabel={t('common.cancel')}
              pending={mutation.isPending}
              danger
              onConfirm={() =>
                mutation.apply({ action: 'delete' }, () =>
                  navigate('/home', { replace: true }),
                )
              }
              onCancel={() => {
                mutation.reset()
                setConfirmDelete(false)
              }}
            />
          ) : (
            existing && (
              <Button
                variant="text"
                className={styles.remove}
                disabled={mutation.isPending}
                onClick={() => {
                  mutation.reset()
                  setConfirmDelete(true)
                }}
              >
                {t('lifeChanges.delete')}
              </Button>
            )
          )}
        </QueryState>
        <BottomArea>
          <div className={styles.bottomActions}>
            <ButtonLink variant="secondary" block to="/home/life-changes">
              {t('lifeChanges.registerOther')}
            </ButtonLink>
            <ButtonLink to="/home">{t('lifeChanges.goHome')}</ButtonLink>
          </div>
        </BottomArea>
      </PageBody>
    </>
  )
}

function TaskOverview({
  memberId,
  code,
  baseDate,
  busy,
  chat,
}: {
  memberId: number
  code: LifeChangeCode
  baseDate: string
  busy: boolean
  chat?: string
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const checklist = useChecklist(memberId, language)
  const mark = useMarkChecklistItem(memberId, language)
  const tasks = relatedLifeChangeTasks(
    checklist.data?.items ?? [],
    code,
    baseDate,
  )
  const { first, others } = splitLifeChangeTasks(tasks)
  const counted = tasks.filter((item) => item.status !== 'NOT_APPLICABLE')
  const done = counted.filter((item) => item.status === 'DONE').length
  const progress = t('checklist.progressDone', { done, total: counted.length })
  const toggle = (item: ChecklistItemResponse, action: MarkAction) =>
    mark.mutate({ item, mark: nextMark(item, action) })

  return (
    <QueryState query={checklist} keepContentOnError={Boolean(checklist.data)}>
      {checklist.isFetching && tasks.length === 0 ? (
        <PageLoader label={t('common.loading')} />
      ) : (
        <>
          <div className={styles.summary}>
            <p>
              {t('lifeChanges.summary', {
                date: formatLongMonthDay(baseDate, language),
                name: t(`checklist.lifeChangeTag.${code}`),
              })}
            </p>
            <h1>
              {t(`lifeChanges.types.${code}.tasksTitle`, {
                count: counted.length,
              })}
            </h1>
            {counted.length > 0 && (
              <div className={styles.progress}>
                <div
                  className={styles.bar}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={counted.length}
                  aria-valuenow={done}
                  aria-label={progress}
                >
                  <span
                    style={{ width: `${(done / counted.length) * 100}%` }}
                  />
                </div>
                <span>{progress}</span>
              </div>
            )}
          </div>
          {mark.isError && (
            <FormError message={markErrorMessage(t, mark.error)} />
          )}
          {tasks.length === 0 && <Muted>{t('lifeChanges.noTasks')}</Muted>}
          {first && (
            <FirstTask
              key={checklistItemKey(first)}
              item={first}
              back={`/home/life-changes/${code}`}
              chat={chat}
              busy={busy || mark.isSaving(first)}
              onNotApplicable={() => toggle(first, 'toggleNotApplicable')}
            />
          )}
          {others.length > 0 && (
            <section className={styles.others}>
              <h2>
                {t(first ? 'lifeChanges.withTasks' : 'lifeChanges.allTasks')}
              </h2>
              <ul className={styles.list}>
                {others.map((item) => (
                  <li key={checklistItemKey(item)}>
                    <TaskRow
                      showLifeChange={false}
                      item={item}
                      busy={busy || mark.isSaving(item)}
                      onToggleDone={() => toggle(item, 'toggleDone')}
                      onToggleNotApplicable={() =>
                        toggle(item, 'toggleNotApplicable')
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {tasks.some((item) => item.penalty) && (
            <p className={styles.note}>
              <span aria-hidden="true">ⓘ</span>
              {t('lifeChanges.penaltyNote')}
            </p>
          )}
        </>
      )}
    </QueryState>
  )
}

/**
 * The yellow "먼저 하세요" card: due date, place and "방법 보기", which opens
 * the checklist detail screen (M07a, "‹" comes back here) where it can be
 * marked done, and "해당 없음".
 */
function FirstTask({
  item,
  back,
  chat,
  busy,
  onNotApplicable,
}: {
  item: ChecklistItemResponse
  back: string
  /** The conversation this flow was opened from (CB-10), kept for the way back. */
  chat?: string
  busy: boolean
  onNotApplicable: () => void
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const where = [
    item.deadline &&
      t('lifeChanges.dueBy', {
        date: formatLongMonthDay(item.deadline, language),
      }),
    item.place,
  ]
    .filter(Boolean)
    .join(' · ')
  // Same line as in the list below, so it stays when the task moves up here.
  const reason = reasonLine(t, item, true)

  return (
    <section className={styles.first}>
      <div className={styles.firstMain}>
        <div className={styles.firstText}>
          <div className={styles.firstTags}>
            <Tag tone="danger">{t('lifeChanges.first')}</Tag>
            <span className={styles.dDay}>
              {deadlineText(item, t('checklist.pastDeadline'))}
            </span>
          </div>
          <h2>{item.title}</h2>
          {where && <p>{where}</p>}
          {reason && <p className={styles.firstReason}>{reason}</p>}
        </div>
        <MascotImage pose="toro" height={96} />
      </div>
      <ButtonLink
        to={`/home/checklist/${encodeURIComponent(item.code)}`}
        state={{ back, from: chat }}
      >
        {t('lifeChanges.howTo')}
      </ButtonLink>
      <Button
        variant="text"
        className={styles.firstSkip}
        disabled={busy}
        onClick={onNotApplicable}
      >
        {t('checklist.notApplicable')}
      </Button>
    </section>
  )
}
