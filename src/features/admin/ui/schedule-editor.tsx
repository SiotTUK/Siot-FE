import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { useId } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { Button, ButtonLink } from '@/shared/ui/button'
import { SelectField, TextAreaField, TextField } from '@/shared/ui/field'
import { PageLoader } from '@/shared/ui/mobile-frame'
import { FormError, Muted, Notice, Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { SwitchField } from '@/shared/ui/switch-field'
import type { GuideKind } from '../api'
import {
  isTaxKind,
  taxScheduleKinds,
  type AdminSchedule,
} from '../schedule-api'
import {
  scheduleLink,
  scheduleMaxLength,
  scheduleMeta,
  scheduleSchema,
  scheduleYear,
  toScheduleForm,
  toScheduleRequest,
  weekday,
  type ParsedScheduleForm,
  type ScheduleForm,
} from '../schedule-form'
import {
  useAdminSchedules,
  useCreateAdminSchedule,
  useGuideTitles,
  useUpdateAdminSchedule,
} from '../use-admin-schedules'
import { ScheduleTags } from './schedule-list'

/** Save errors: the admin's own wording for codes the shared text misreads. */
function saveError(t: TFunction, error: unknown) {
  if (error instanceof ApiError && error.code === 'GUIDE_NOT_FOUND')
    return t('admin.schedules.guideNotFound')
  if (error instanceof ApiError && error.code === 'SCHEDULE_NOT_FOUND')
    return t('admin.schedules.notFound')
  return errorMessage(t, error)
}

/** CAL-01~03: a schedule outside the regular tax rounds. */
export function ScheduleCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateAdminSchedule()
  return (
    <>
      <Notice tone="note">{t('admin.schedules.createNotice')}</Notice>
      <ScheduleFields
        saved={null}
        pending={create.isPending}
        error={create.isError ? saveError(t, create.error) : undefined}
        onSave={(values) =>
          create.mutate(toScheduleRequest(values), {
            onSuccess: (saved) =>
              navigate(scheduleLink(saved), {
                replace: true,
                state: { created: true },
              }),
          })
        }
      />
    </>
  )
}

/**
 * CAL-01~03·NTF-01 edit, off and on. There is no single-schedule API, so the
 * schedule is found in its start year's list (`?year=`).
 */
export function ScheduleEdit({
  scheduleId,
  year,
  created,
}: {
  scheduleId: number
  year: number | undefined
  created?: boolean
}) {
  if (!year || !Number.isInteger(scheduleId) || scheduleId <= 0)
    return <NotFound year={year} />
  return (
    <ScheduleEditInYear scheduleId={scheduleId} year={year} created={created} />
  )
}

function ScheduleEditInYear({
  scheduleId,
  year,
  created,
}: {
  scheduleId: number
  year: number
  created?: boolean
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const list = useAdminSchedules(year)
  // Kept here: the form restarts from the saved values after a save.
  const update = useUpdateAdminSchedule(scheduleId)
  const saved =
    list.data?.find((schedule) => schedule.scheduleId === scheduleId) ??
    // Moved to another year: shown from the response until the address follows.
    (update.data?.scheduleId === scheduleId ? update.data : undefined)
  return (
    <QueryState query={list}>
      {saved ? (
        <ScheduleEditForm
          key={saved.updatedAt}
          saved={saved}
          created={created}
          update={update}
          onSave={(body) =>
            update.mutate(body, {
              onSuccess: (next) => {
                if (scheduleYear(next.startsOn) !== year)
                  navigate(scheduleLink(next), { replace: true })
              },
            })
          }
        />
      ) : list.isFetching ? (
        // A list cached before the schedule was made or moved.
        <PageLoader label={t('common.loading')} />
      ) : (
        <NotFound year={year} />
      )}
    </QueryState>
  )
}

function NotFound({ year }: { year: number | undefined }) {
  const { t } = useTranslation()
  return (
    <>
      <Notice tone="danger">{t('admin.schedules.notFound')}</Notice>
      <ButtonLink
        to={year ? `/admin/schedules?year=${year}` : '/admin/schedules'}
        variant="secondary"
      >
        {t('admin.schedules.backToList')}
      </ButtonLink>
    </>
  )
}

function ScheduleEditForm({
  saved,
  created,
  update,
  onSave,
}: {
  saved: AdminSchedule
  created?: boolean
  update: ReturnType<typeof useUpdateAdminSchedule>
  onSave: (body: ReturnType<typeof toScheduleRequest>) => void
}) {
  const { t } = useTranslation()
  return (
    <Stack gap={16}>
      <Muted>{scheduleMeta(t, saved, currentLanguage())}</Muted>
      <ScheduleTags schedule={saved} />
      {created && !update.isSuccess && (
        <Notice tone="success">{t('admin.schedules.created')}</Notice>
      )}
      {update.isSuccess && <Notice tone="success">{t('admin.saved')}</Notice>}
      {saved.autoGenerated && (
        <Notice tone="note">{t('admin.schedules.autoGeneratedNotice')}</Notice>
      )}
      <ScheduleFields
        saved={saved}
        pending={update.isPending}
        error={update.isError ? saveError(t, update.error) : undefined}
        onSave={(values) => onSave(toScheduleRequest(values))}
      />
    </Stack>
  )
}

const guideKindOrder: GuideKind[] = ['RULE', 'CHECKLIST', 'LIFE_CHANGE_TASK']

/** The form shared by create and edit; both send every value. */
function ScheduleFields({
  saved,
  pending,
  error,
  onSave,
}: {
  saved: AdminSchedule | null
  pending: boolean
  error?: string
  onSave: (values: ParsedScheduleForm) => void
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const kindListId = useId()
  const { guides } = useGuideTitles()
  const { register, handleSubmit, formState, control } = useForm<
    ScheduleForm,
    unknown,
    ParsedScheduleForm
  >({
    resolver: zodResolver(scheduleSchema),
    defaultValues: toScheduleForm(saved),
  })
  const errors = formState.errors
  const [kind, startsOn, endsOn, active] = useWatch({
    control,
    name: ['kind', 'startsOn', 'endsOn', 'active'],
  })
  const onSubmit = handleSubmit(onSave)

  // Rules first: the tax items (tax-car …) are rules. The saved code stays
  // selectable even when the list failed or no longer has it.
  const items = [...(guides.data ?? [])].sort(
    (a, b) => guideKindOrder.indexOf(a.kind) - guideKindOrder.indexOf(b.kind),
  )
  const guideOptions = [
    { value: '', label: t('admin.schedules.guideNone') },
    ...items.map((guide) => ({
      value: guide.code,
      label: `[${t(`admin.schedules.guideKinds.${guide.kind}`)}] ${
        guide.title ?? guide.code
      } · ${guide.code}`,
    })),
  ]
  if (
    saved?.guideCode &&
    !guideOptions.some((option) => option.value === saved.guideCode)
  )
    guideOptions.push({ value: saved.guideCode, label: saved.guideCode })
  const dayHelp = (date: string) => {
    const day = date ? weekday(date) : ''
    return day ? t('admin.schedules.weekdayHelp', { weekday: day }) : undefined
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack gap={14}>
        <TextField
          {...register('kind')}
          list={kindListId}
          maxLength={scheduleMaxLength.kind}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          label={t('admin.schedules.fields.kind')}
          help={t('admin.schedules.kindHelp')}
          error={msg(errors.kind?.message)}
        />
        <datalist id={kindListId}>
          {taxScheduleKinds.map((value) => (
            <option key={value} value={value}>
              {t(`admin.schedules.kinds.${value}`)}
            </option>
          ))}
        </datalist>
        {isTaxKind(kind.trim()) && (
          <Notice tone="note">{t('admin.schedules.taxKindNotice')}</Notice>
        )}
        <SelectField
          {...register('guideCode')}
          label={t('admin.schedules.fields.guideCode')}
          options={guideOptions}
        />
        <Muted>{t('admin.schedules.guideHelp')}</Muted>
        {guides.isError && (
          <FormError message={t('admin.schedules.guidesFailed')} />
        )}
        {/* Stacked, each with its weekday: a deadline on a day off stands out. */}
        <TextField
          {...register('startsOn')}
          type="date"
          label={t('admin.schedules.fields.startsOn')}
          help={dayHelp(startsOn)}
          error={msg(errors.startsOn?.message)}
        />
        <TextField
          {...register('endsOn')}
          type="date"
          label={t('admin.schedules.fields.endsOn')}
          help={dayHelp(endsOn) ?? t('admin.schedules.endsOnHelp')}
          error={msg(errors.endsOn?.message)}
        />
        <TextAreaField
          {...register('targetDescription')}
          rows={3}
          maxLength={scheduleMaxLength.targetDescription}
          label={t('admin.schedules.fields.targetDescription')}
          help={t('admin.schedules.targetHelp')}
          error={msg(errors.targetDescription?.message)}
        />
        <TextField
          {...register('sourceUrl')}
          type="url"
          inputMode="url"
          maxLength={scheduleMaxLength.sourceUrl}
          label={t('admin.schedules.fields.sourceUrl')}
          placeholder="https://"
          error={msg(errors.sourceUrl?.message)}
        />
        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <SwitchField
              name={field.name}
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
              label={t('admin.schedules.fields.active')}
              hint={t('admin.schedules.activeHint')}
            />
          )}
        />
        {saved?.active && !active && (
          <Notice tone="danger">{t('admin.schedules.turningOff')}</Notice>
        )}
        {saved && !saved.active && active && (
          <Notice tone="note">{t('admin.schedules.turningOn')}</Notice>
        )}
        <FormError message={error} />
        <Button type="submit" loading={pending}>
          {t(saved ? 'admin.save' : 'admin.schedules.createSubmit')}
        </Button>
      </Stack>
    </form>
  )
}
