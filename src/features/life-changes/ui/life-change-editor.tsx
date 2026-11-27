import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import type { ChecklistItemResponse } from '@/features/checklist/api'
import {
  checklistItemKey,
  deadlineText,
  markErrorMessage,
  nextMark,
} from '@/features/checklist/checklist'
import { ChecklistCard } from '@/features/checklist/ui/checklist-card'
import {
  useChecklist,
  useMarkChecklistItem,
} from '@/features/checklist/use-checklist'
import toro from '@/shared/assets/mascot/toro.png'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import {
  formatCalendarDate,
  formatLongMonthDay,
  koreaToday,
} from '@/shared/i18n/format'
import { Button, ButtonLink } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { TextField } from '@/shared/ui/field'
import { InfoIcon } from '@/shared/ui/icons'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { BottomArea, FormError, Muted } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'
import { relatedLifeChangeTasks, type LifeChangeCode } from '../life-changes'
import { useChangeLifeChange, useLifeChanges } from '../use-life-changes'
import { LifeChangeStart } from './life-change-start'
import styles from './life-changes.module.css'

/**
 * F06b (Figma v2): the tasks of a registered life change. The nearest open
 * task sits in a yellow "먼저 하세요" card, the rest under "함께 챙길 일".
 * "수정" opens the date form. Not registered yet → F06a with it selected.
 */
export function LifeChangeEditor({
  memberId,
  code,
}: {
  memberId: number
  code: LifeChangeCode
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const changes = useLifeChanges(memberId)
  const mutation = useChangeLifeChange(memberId, code)
  const existing = changes.data?.find((entry) => entry.lifeChangeCode === code)
  const savedDate = existing?.baseDate ?? ''
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleting =
    mutation.isPending && mutation.variables?.change.action === 'delete'

  if (changes.isSuccess && !existing && !mutation.isPending)
    return <LifeChangeStart memberId={memberId} initialCode={code} />

  return (
    <>
      <ScreenHeader
        title={t(`lifeChanges.types.${code}.title`)}
        back={{ label: t('lifeChanges.backHome'), to: '/home' }}
        actions={
          savedDate && (
            <HeaderAction onClick={() => setEditing((value) => !value)}>
              {t(editing ? 'lifeChanges.editDone' : 'lifeChanges.edit')}
            </HeaderAction>
          )
        }
      />
      <PageBody className={styles.editor}>
        <QueryState query={changes} keepContentOnError={changes.isRefetchError}>
          {savedDate && (
            <p className={styles.meta}>
              {t('lifeChanges.registered', {
                date: formatCalendarDate(savedDate, i18n.language),
              })}
            </p>
          )}
          {editing && (
            <DateForm
              key={savedDate}
              code={code}
              savedDate={savedDate}
              locked={mutation.isPending || confirmDelete}
              saving={mutation.isPending && !deleting}
              onSave={(baseDate) =>
                mutation.apply({ action: 'save', baseDate }, () =>
                  setEditing(false),
                )
              }
            />
          )}
          {mutation.isError && (
            <FormError message={errorMessage(t, mutation.error)} />
          )}
          {mutation.isSuccess && mutation.data && (
            <p role="status" className={styles.success}>
              {t('lifeChanges.saved')}
            </p>
          )}
          {savedDate && (
            <>
              <RelatedTasks
                memberId={memberId}
                code={code}
                savedDate={savedDate}
                busy={mutation.isPending}
              />
              <p className={styles.note}>
                <InfoIcon />
                {t('lifeChanges.fineNote')}
              </p>
              {confirmDelete ? (
                <ConfirmPanel
                  message={t('lifeChanges.confirmDelete')}
                  confirmLabel={t('lifeChanges.delete')}
                  cancelLabel={t('common.cancel')}
                  pending={deleting}
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
              )}
              <BottomArea>
                <div className={styles.bottomActions}>
                  <ButtonLink variant="secondary" to="/home/life-changes">
                    {t('lifeChanges.other')}
                  </ButtonLink>
                  <ButtonLink to="/home">{t('lifeChanges.home')}</ButtonLink>
                </div>
              </BottomArea>
            </>
          )}
        </QueryState>
      </PageBody>
    </>
  )
}

function DateForm({
  code,
  savedDate,
  locked,
  saving,
  onSave,
}: {
  code: LifeChangeCode
  savedDate: string
  locked: boolean
  saving: boolean
  onSave: (date: string) => void
}) {
  const { t } = useTranslation()
  const message = useMessage()
  const move = code === 'LC-01'
  const schema = z.object({
    baseDate: z.iso
      .date('lifeChanges.invalidDate')
      .refine(
        (value) => !move || value <= koreaToday(),
        'lifeChanges.futureMove',
      ),
  })
  const { register, handleSubmit, control, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { baseDate: savedDate },
  })
  const date = useWatch({ control, name: 'baseDate' })
  const submit = handleSubmit(({ baseDate }) => {
    if (!locked && baseDate !== savedDate) onSave(baseDate)
  })

  return (
    <form
      noValidate
      className={styles.form}
      onSubmit={(event) => void submit(event)}
    >
      <TextField
        {...register('baseDate')}
        label={t(`lifeChanges.types.${code}.date`)}
        type="date"
        required
        max={move ? koreaToday() : undefined}
        disabled={locked}
        error={message(formState.errors.baseDate?.message)}
        className={styles.date}
      />
      {savedDate && date !== savedDate && (
        <Muted>{t('lifeChanges.dateChanged')}</Muted>
      )}
      <Button
        type="submit"
        disabled={locked || date === savedDate}
        loading={saving}
      >
        {t('lifeChanges.save')}
      </Button>
    </form>
  )
}

/** The open task with the nearest server deadline, else the first open one. */
function firstTask(items: ChecklistItemResponse[]) {
  const open = items.filter(
    (item) => item.status === 'TODO' || item.status === 'OVERDUE',
  )
  return (
    [...open]
      .filter((item) => item.dDay !== null)
      .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))[0] ?? open[0]
  )
}

function RelatedTasks({
  memberId,
  code,
  savedDate,
  busy,
}: {
  memberId: number
  code: LifeChangeCode
  savedDate: string
  busy: boolean
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const checklist = useChecklist(memberId, language)
  const mark = useMarkChecklistItem(memberId, language)
  const items = relatedLifeChangeTasks(
    checklist.data?.items ?? [],
    code,
    savedDate,
  )
  const first = firstTask(items)
  const others = items.filter((item) => item !== first)
  const done = items.filter((item) => item.status === 'DONE').length
  const progressText = t('checklist.progressDone', {
    done,
    total: items.length,
  })

  return (
    <section className={styles.tasks}>
      <QueryState query={checklist}>
        {checklist.isFetching && items.length === 0 ? (
          <PageLoader label={t('common.loading')} />
        ) : (
          <>
            <h2 className={styles.tasksTitle}>
              {t('lifeChanges.tasksTitle', {
                name: t(`checklist.lifeChangeTag.${code}`),
                count: items.length,
              })}
            </h2>
            {items.length > 0 && (
              <div className={styles.progress}>
                <progress
                  max={items.length}
                  value={done}
                  aria-label={progressText}
                />
                <span>{progressText}</span>
              </div>
            )}
            {mark.isError && (
              <FormError message={markErrorMessage(t, mark.error)} />
            )}
            {items.length === 0 && <Muted>{t('lifeChanges.noTasks')}</Muted>}
            {first && <FirstTask item={first} />}
            {others.length > 0 && (
              <>
                <h3 className={styles.together}>{t('lifeChanges.together')}</h3>
                <ul className={styles.list}>
                  {others.map((item) => (
                    <li key={checklistItemKey(item)}>
                      <ChecklistCard
                        context="lifeChange"
                        item={item}
                        busy={busy || mark.isPending}
                        onToggleDone={() =>
                          mark.mutate({
                            item,
                            mark: nextMark(item, 'toggleDone'),
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </QueryState>
    </section>
  )
}

/** Yellow "먼저 하세요" card with 토로 and "방법 보기" (Figma v2 F06b). */
function FirstTask({ item }: { item: ChecklistItemResponse }) {
  const { t } = useTranslation()
  const dDay = deadlineText(item, t('checklist.pastDeadline'))
  const line = [
    item.deadline &&
      t('lifeChanges.dueAt', {
        date: formatLongMonthDay(item.deadline, currentLanguage()),
      }),
    item.place,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className={styles.first}>
      <div className={styles.firstText}>
        <div className={styles.firstTags}>
          <span>{t('lifeChanges.first')}</span>
          {dDay && <span data-dday>{dDay}</span>}
        </div>
        <h3>{item.title}</h3>
        {line && <p>{line}</p>}
        <Link
          className={styles.firstAction}
          to={`/home/checklist/${encodeURIComponent(item.code)}`}
        >
          {t('lifeChanges.firstHow')}
        </Link>
      </div>
      <img src={toro} alt="" width={64} height={64} />
    </div>
  )
}
