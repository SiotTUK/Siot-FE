import { koreaToday } from '@/shared/i18n/format'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  checklistItemKey,
  markErrorMessage,
  nextMark,
} from '@/features/checklist/checklist'
import { ChecklistCard } from '@/features/checklist/ui/checklist-card'
import {
  useChecklist,
  useMarkChecklistItem,
} from '@/features/checklist/use-checklist'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { TextField } from '@/shared/ui/field'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { FormError, Muted, Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { ScreenHeader } from '@/shared/ui/screen-header'
import { relatedLifeChangeTasks, type LifeChangeCode } from '../life-changes'
import { useChangeLifeChange, useLifeChanges } from '../use-life-changes'
import styles from './life-changes.module.css'

export function LifeChangeEditor({
  memberId,
  code,
}: {
  memberId: number
  code: LifeChangeCode
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const changes = useLifeChanges(memberId)
  const mutation = useChangeLifeChange(memberId, code)
  const existing = changes.data?.find((entry) => entry.lifeChangeCode === code)
  const savedDate = existing?.baseDate ?? ''
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleting =
    mutation.isPending && mutation.variables?.change.action === 'delete'

  return (
    <>
      <ScreenHeader
        title={t(`lifeChanges.types.${code}.title`)}
        back={{ label: t('lifeChanges.backHome'), to: '/home' }}
      />
      <PageBody className={styles.editor}>
        <QueryState query={changes} keepContentOnError={changes.isRefetchError}>
          <DateForm
            key={savedDate}
            code={code}
            savedDate={savedDate}
            locked={mutation.isPending || confirmDelete}
            saving={mutation.isPending && !deleting}
            onSave={(baseDate) => mutation.apply({ action: 'save', baseDate })}
          />
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

  return (
    <section className={styles.tasks}>
      <QueryState query={checklist}>
        {checklist.isFetching && items.length === 0 ? (
          <PageLoader label={t('common.loading')} />
        ) : (
          <>
            <h2>{t('lifeChanges.tasks', { count: items.length })}</h2>
            {mark.isError && (
              <FormError message={markErrorMessage(t, mark.error)} />
            )}
            {items.length === 0 ? (
              <Muted>{t('lifeChanges.noTasks')}</Muted>
            ) : (
              <Stack as="ul" gap={10}>
                {items.map((item) => (
                  <li key={checklistItemKey(item)}>
                    <ChecklistCard
                      showLifeChange={false}
                      item={item}
                      busy={busy || mark.isPending}
                      onToggleDone={() =>
                        mark.mutate({
                          item,
                          mark: nextMark(item, 'toggleDone'),
                        })
                      }
                      onToggleNotApplicable={() =>
                        mark.mutate({
                          item,
                          mark: nextMark(item, 'toggleNotApplicable'),
                        })
                      }
                    />
                  </li>
                ))}
              </Stack>
            )}
          </>
        )}
      </QueryState>
    </section>
  )
}
