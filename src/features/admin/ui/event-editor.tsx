import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { currentLanguage, languages } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { SelectField, TextAreaField, TextField } from '@/shared/ui/field'
import {
  FormError,
  Muted,
  Notice,
  Section,
  Stack,
  Tag,
  Toolbar,
} from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import {
  eventCategories,
  eventRegions,
  type AdminEventCreateRequest,
  type AdminEventDetail,
  type EventField,
} from '../event-api'
import {
  eventCreateSchema,
  eventMaxLength,
  eventUpdateSchema,
  scheduleFields,
  toEventCreateRequest,
  toEventForm,
  toEventUpdateRequest,
  type EventForm,
  type ParsedEventForm,
} from '../event-form'
import {
  useAdminEvent,
  useCreateAdminEvent,
  useDeleteAdminEvent,
  useUpdateAdminEvent,
} from '../use-admin-events'
import styles from './admin.module.css'

// Korean is the source text; these are its translations.
const translatedLanguages = ['en', 'zh', 'vi'] as const

/** IDs from a 409 DUPLICATE_EVENT (`details.eventIds`). */
function duplicateIds(error: unknown) {
  if (!(error instanceof ApiError) || error.code !== 'DUPLICATE_EVENT') return
  const ids = error.details?.eventIds
  return Array.isArray(ids) ? ids.map(Number) : []
}

/** EVE-07: a Korean event; en/zh/vi are translated when saved. */
export function EventCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateAdminEvent()
  /** The request held back by a duplicate warning, sent again with force. */
  const [held, setHeld] = useState<AdminEventCreateRequest>()
  const duplicates = duplicateIds(create.error)

  const send = (body: AdminEventCreateRequest, force: boolean) =>
    create.mutate(
      { body, force },
      {
        onSuccess: (saved) =>
          navigate(`/admin/events/${saved.eventId}`, {
            replace: true,
            state: { created: true },
          }),
        onError: (error) => setHeld(duplicateIds(error) ? body : undefined),
      },
    )

  return (
    <>
      <Notice tone="note">{t('admin.events.createNotice')}</Notice>
      <EventFields
        mode="create"
        saved={null}
        pending={create.isPending}
        error={
          create.isError && !duplicates
            ? errorMessage(t, create.error)
            : undefined
        }
        onSave={(values) => send(toEventCreateRequest(values), false)}
        locked={Boolean(held && duplicates)}
      />
      {held && duplicates && (
        <Section title={t('admin.events.duplicateTitle')}>
          <Stack gap={10}>
            <Muted>{t('admin.events.duplicateHelp')}</Muted>
            <ul className={styles.runs}>
              {duplicates.map((id) => (
                <li key={id}>
                  <Link
                    className={styles.link}
                    to={`/admin/events/${id}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {t('admin.events.openEvent', { id })}
                  </Link>
                </li>
              ))}
            </ul>
            <ConfirmPanel
              message={t('admin.events.forceConfirm')}
              confirmLabel={t('admin.events.forceCreate')}
              cancelLabel={t('admin.events.backToForm')}
              pending={create.isPending}
              onConfirm={() => send(held, true)}
              onCancel={() => {
                setHeld(undefined)
                create.reset()
              }}
            />
          </Stack>
        </Section>
      )}
    </>
  )
}

/** EVE-08·09: edit or delete; deleted events are read-only. */
export function EventEdit({
  eventId,
  created,
}: {
  eventId: number
  created?: boolean
}) {
  const event = useAdminEvent(eventId)
  // Kept here: the form restarts from the saved values after a save.
  const update = useUpdateAdminEvent(eventId)
  return (
    <QueryState query={event}>
      {event.data && (
        <EventEditForm
          key={event.data.updatedAt}
          saved={event.data}
          created={created}
          update={update}
        />
      )}
    </QueryState>
  )
}

function EventEditForm({
  saved,
  created,
  update,
}: {
  saved: AdminEventDetail
  created?: boolean
  update: ReturnType<typeof useUpdateAdminEvent>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = currentLanguage()
  const remove = useDeleteAdminEvent(saved.eventId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [nothingChanged, setNothingChanged] = useState(false)
  const deleted = saved.status === 'DELETED'
  const done = translatedLanguages.filter((code) =>
    saved.translatedLanguages.includes(code),
  )
  const missing = translatedLanguages.filter(
    (code) => !saved.translatedLanguages.includes(code),
  )

  return (
    <Stack gap={16}>
      <Muted>
        #{saved.eventId} · {t(`admin.events.sources.${saved.source}`)}
        {saved.externalId && ` ${saved.externalId}`} ·{' '}
        {t('admin.events.revision', { revision: saved.revision })} ·{' '}
        {t('admin.updatedAt', {
          date: formatDateTime(saved.updatedAt, language),
        })}
      </Muted>
      {deleted && (
        <Notice tone="danger">{t('admin.events.deletedNotice')}</Notice>
      )}
      {created && !update.isSuccess && (
        <Notice tone="success">{t('admin.events.created')}</Notice>
      )}
      {update.isSuccess && <Notice tone="success">{t('admin.saved')}</Notice>}
      <p className={styles.tags}>
        {done.map((code) => (
          <Tag key={code} tone="main">
            {t('admin.events.translated', { language: languages[code] })}
          </Tag>
        ))}
        {missing.map((code) => (
          <Tag key={code} tone="warning">
            {t('admin.events.notTranslated', { language: languages[code] })}
          </Tag>
        ))}
        {saved.tags.map((tag) => (
          <Tag key={tag}>#{tag}</Tag>
        ))}
      </p>
      {!deleted && (
        <Notice tone="note">
          {t('admin.events.lockHelp')}
          {saved.lockedFields.length > 0 &&
            ` ${t('admin.events.lockedNow', {
              fields: saved.lockedFields
                .map((field) => t(`admin.events.fields.${field}`))
                .join(', '),
            })}`}
        </Notice>
      )}
      <EventFields
        mode="edit"
        saved={saved}
        readOnly={deleted}
        pending={update.isPending}
        error={
          nothingChanged
            ? t('admin.events.nothingChanged')
            : update.isError
              ? errorMessage(t, update.error)
              : undefined
        }
        onSave={(values) => {
          const body = toEventUpdateRequest(values, saved)
          setNothingChanged(Object.keys(body).length === 0)
          if (Object.keys(body).length > 0) update.mutate(body)
        }}
      />
      {!deleted &&
        (confirmDelete ? (
          <ConfirmPanel
            danger
            message={t('admin.events.deleteConfirm', { title: saved.title })}
            confirmLabel={t('admin.events.delete')}
            cancelLabel={t('admin.cancel')}
            pending={remove.isPending}
            onConfirm={() =>
              remove.mutate(undefined, {
                onSuccess: () => navigate('/admin/events', { replace: true }),
              })
            }
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <Button variant="text" onClick={() => setConfirmDelete(true)}>
            {t('admin.events.delete')}
          </Button>
        ))}
      {remove.isError && <FormError message={errorMessage(t, remove.error)} />}
    </Stack>
  )
}

/** The Korean event form shared by create and edit. */
function EventFields({
  mode,
  saved,
  readOnly,
  locked,
  pending,
  error,
  onSave,
}: {
  mode: 'create' | 'edit'
  saved: AdminEventDetail | null
  readOnly?: boolean
  /** Create: frozen while the duplicate question is open. */
  locked?: boolean
  pending: boolean
  error?: string
  onSave: (values: ParsedEventForm) => void
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const schema =
    mode === 'edit' && saved ? eventUpdateSchema(saved) : eventCreateSchema
  const { register, handleSubmit, formState, control } = useForm<
    EventForm,
    unknown,
    ParsedEventForm
  >({
    resolver: zodResolver(schema),
    defaultValues: toEventForm(saved),
  })
  const errors = formState.errors
  const isLocked = (field: EventField) =>
    saved?.lockedFields.includes(field) ?? false
  const help = (field: EventField, extra?: string) =>
    [isLocked(field) && t('admin.events.locked'), extra]
      .filter(Boolean)
      .join(' · ') || undefined
  const schedule = useWatch({ control, name: [...scheduleFields] })
  const before = toEventForm(saved)
  const scheduleChanged =
    mode === 'edit' &&
    scheduleFields.some((field, index) => schedule[index] !== before[field])
  const onSubmit = handleSubmit(onSave)
  const clearHelp = mode === 'edit' ? t('admin.events.blankClears') : undefined
  const dateHelp =
    mode === 'edit' ? t('admin.events.cannotClearHelp') : undefined
  const text = (
    field: 'title' | 'venue' | 'priceInfo',
    labelKey: string,
    max: number,
  ) => (
    <TextField
      {...register(field)}
      maxLength={max}
      label={t(labelKey)}
      help={help(field, field === 'title' ? undefined : clearHelp)}
      error={msg(errors[field]?.message)}
    />
  )
  const urlField = (field: 'applicationUrl' | 'sourceUrl' | 'thumbnailUrl') => (
    <TextField
      {...register(field)}
      type="url"
      inputMode="url"
      maxLength={eventMaxLength.url}
      label={t(`admin.events.fields.${field}`)}
      placeholder="https://"
      help={help(field, clearHelp)}
      error={msg(errors[field]?.message)}
    />
  )

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <fieldset disabled={readOnly || locked} className={styles.fieldset}>
        <Stack gap={14}>
          {text('title', 'admin.events.fields.title', eventMaxLength.title)}
          <TextAreaField
            {...register('description')}
            rows={6}
            maxLength={eventMaxLength.description}
            label={t('admin.events.fields.description')}
            help={help('description', clearHelp)}
            error={msg(errors.description?.message)}
          />
          {text('venue', 'admin.events.fields.venue', eventMaxLength.venue)}
          <Toolbar>
            <TextField
              {...register('startsOn')}
              type="date"
              label={t('admin.events.fields.startsOn')}
              help={help('startsOn', dateHelp)}
              error={msg(errors.startsOn?.message)}
            />
            <TextField
              {...register('endsOn')}
              type="date"
              label={t('admin.events.fields.endsOn')}
              help={help('endsOn')}
              error={msg(errors.endsOn?.message)}
            />
          </Toolbar>
          <Toolbar>
            <TextField
              {...register('startsAt')}
              type="time"
              label={t('admin.events.fields.startsAt')}
              help={help(
                'startsAt',
                mode === 'create'
                  ? t('admin.events.timeUnknownHelp')
                  : undefined,
              )}
              error={msg(errors.startsAt?.message)}
            />
            <TextField
              {...register('endsAt')}
              type="time"
              label={t('admin.events.fields.endsAt')}
              help={help('endsAt')}
              error={msg(errors.endsAt?.message)}
            />
          </Toolbar>
          {scheduleChanged && (
            <Notice tone="note">{t('admin.events.scheduleNotice')}</Notice>
          )}
          {text(
            'priceInfo',
            'admin.events.fields.priceInfo',
            eventMaxLength.priceInfo,
          )}
          <TextField
            {...register('applicationDeadline')}
            type="datetime-local"
            label={t('admin.events.fields.applicationDeadline')}
            help={help('applicationDeadline', t('admin.events.koreaTime'))}
            error={msg(errors.applicationDeadline?.message)}
          />
          {urlField('applicationUrl')}
          {urlField('sourceUrl')}
          <Toolbar>
            <SelectField
              {...register('region')}
              label={t('admin.events.fields.region')}
              error={msg(errors.region?.message)}
              options={[
                { value: '', label: t('admin.events.choose') },
                ...eventRegions.map((value) => ({
                  value,
                  label: t(`admin.events.regions.${value}`),
                })),
              ]}
            />
            <SelectField
              {...register('category')}
              label={t('admin.events.fields.category')}
              options={[
                ...(mode === 'create'
                  ? [{ value: '', label: t('admin.events.categoryAuto') }]
                  : []),
                ...eventCategories.map((value) => ({
                  value,
                  label: t(`admin.events.categories.${value}`),
                })),
              ]}
            />
          </Toolbar>
          <SelectField
            {...register('multicultural')}
            label={t('admin.events.fields.multicultural')}
            options={[
              ...(mode === 'create'
                ? [{ value: '', label: t('admin.events.multiculturalAuto') }]
                : []),
              { value: 'true', label: t('admin.events.multiculturalYes') },
              { value: 'false', label: t('admin.events.multiculturalNo') },
            ]}
          />
          {urlField('thumbnailUrl')}
          <FormError message={error} />
          {!readOnly && !locked && (
            <Button type="submit" loading={pending}>
              {t(
                mode === 'create' ? 'admin.events.createSubmit' : 'admin.save',
              )}
            </Button>
          )}
        </Stack>
      </fieldset>
    </form>
  )
}
