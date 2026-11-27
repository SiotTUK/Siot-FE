import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { formatCalendarDate, koreaToday } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/field'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, PageHeading } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { ScreenHeader } from '@/shared/ui/screen-header'
import { lifeChangeCodes, type LifeChangeCode } from '../life-changes'
import { useChangeLifeChange, useLifeChanges } from '../use-life-changes'
import { LifeChangeIcon } from './life-change-icon'
import styles from './life-changes.module.css'

/**
 * F06a 생활 변화 등록 (Figma v2): pick what changed, say when, then "할 일
 * 보기" saves it and opens its tasks (F06b). A change already registered
 * shows its date and keeps it unless the member edits it.
 */
export function LifeChangeStart({
  memberId,
  initialCode = 'LC-01',
}: {
  memberId: number
  initialCode?: LifeChangeCode
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const changes = useLifeChanges(memberId)
  const [code, setCode] = useState<LifeChangeCode>(initialCode)
  const saved = changes.data?.find((entry) => entry.lifeChangeCode === code)

  return (
    <>
      <ScreenHeader
        title={t('lifeChanges.trigger')}
        back={{ label: t('lifeChanges.backHome'), to: '/home' }}
      />
      <PageBody className={styles.editor}>
        <PageHeading title={t('lifeChanges.startTitle')}>
          <p className={styles.hint}>{t('lifeChanges.startHint')}</p>
        </PageHeading>
        <QueryState query={changes}>
          <fieldset className={styles.types}>
            <legend className="visually-hidden">
              {t('lifeChanges.startTitle')}
            </legend>
            {lifeChangeCodes.map((option) => {
              const date = changes.data?.find(
                (entry) => entry.lifeChangeCode === option,
              )?.baseDate
              return (
                <label key={option} className={styles.type}>
                  <span className={styles.typeIcon}>
                    <LifeChangeIcon code={option} />
                  </span>
                  <span className={styles.typeText}>
                    <strong>{t(`lifeChanges.types.${option}.title`)}</strong>
                    <small>
                      {date
                        ? t('lifeChanges.registered', {
                            date: formatCalendarDate(date, i18n.language),
                          })
                        : t(`lifeChanges.types.${option}.hint`)}
                    </small>
                  </span>
                  <input
                    type="radio"
                    name="lifeChange"
                    value={option}
                    checked={code === option}
                    onChange={() => setCode(option)}
                  />
                </label>
              )
            })}
          </fieldset>
          <StartForm
            key={`${code}:${saved?.baseDate ?? ''}`}
            memberId={memberId}
            code={code}
            savedDate={saved?.baseDate ?? ''}
            onDone={() => navigate(`/home/life-changes/${code}`)}
          />
        </QueryState>
      </PageBody>
    </>
  )
}

function StartForm({
  memberId,
  code,
  savedDate,
  onDone,
}: {
  memberId: number
  code: LifeChangeCode
  savedDate: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const message = useMessage()
  const mutation = useChangeLifeChange(memberId, code)
  const move = code === 'LC-01'
  const schema = z.object({
    baseDate: z.iso
      .date('lifeChanges.invalidDate')
      .refine(
        (value) => !move || value <= koreaToday(),
        'lifeChanges.futureMove',
      ),
  })
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { baseDate: savedDate },
  })
  const submit = handleSubmit(({ baseDate }) => {
    if (mutation.isPending) return
    if (baseDate === savedDate) onDone()
    else mutation.apply({ action: 'save', baseDate }, onDone)
  })

  return (
    <form
      noValidate
      className={styles.form}
      onSubmit={(event) => void submit(event)}
    >
      <TextField
        {...register('baseDate')}
        label={t('lifeChanges.when')}
        type="date"
        required
        max={move ? koreaToday() : undefined}
        disabled={mutation.isPending}
        error={message(formState.errors.baseDate?.message)}
        className={styles.date}
      />
      {mutation.isError && (
        <FormError message={errorMessage(t, mutation.error)} />
      )}
      <Button type="submit" loading={mutation.isPending}>
        {t('lifeChanges.showTasks')}
      </Button>
    </form>
  )
}
