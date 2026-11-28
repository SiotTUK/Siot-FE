import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { z } from 'zod'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { CheckField, TextAreaField, TextField } from '@/shared/ui/field'
import {
  FormError,
  Muted,
  Notice,
  Section,
  Stack,
  Toolbar,
} from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { AdminRuleDetail } from '../rule-api'
import {
  ruleCreateSchema,
  ruleFormSchema,
  ruleMaxLength,
  sourcesMaxItems,
  toRuleCreateRequest,
  toRuleForm,
  toRuleUpdateRequest,
  type RuleForm,
} from '../rule-form'
import {
  useAdminRule,
  useAdminRules,
  useCreateRule,
  useDeleteRule,
  useUpdateRule,
} from '../use-admin-rules'
import styles from './admin.module.css'
import { RuleTranslations } from './rule-translations'

type ParsedRuleForm = z.output<typeof ruleFormSchema>

const textFields = [
  ['when', 'admin.rules.when', false],
  ['place', 'admin.rules.place', true],
  ['fee', 'admin.rules.fee', false],
  ['penalty', 'admin.rules.penalty', true],
  ['law', 'admin.rules.law', false],
  ['contact', 'admin.rules.contact', false],
] as const

/** RUL-09: new rule. The BE makes en/zh/vi by auto-translation (RUL-13). */
export function RuleCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateRule()
  return (
    <>
      <Notice tone="note">{t('admin.rules.createNotice')}</Notice>
      <RuleFields
        mode="create"
        saved={null}
        pending={create.isPending}
        error={create.isError ? errorMessage(t, create.error) : undefined}
        onSave={(values) =>
          create.mutate(toRuleCreateRequest(values), {
            onSuccess: (saved) =>
              navigate(`/admin/rules/${encodeURIComponent(saved.code)}`, {
                replace: true,
                state: { created: true },
              }),
          })
        }
      />
    </>
  )
}

/** RUL-10·11: edit or delete one rule; deleted rules are read-only. */
export function RuleEdit({
  code,
  created,
}: {
  code: string
  created?: boolean
}) {
  const rule = useAdminRule(code)
  // The detail has no "deleted" flag; the list row has.
  const row = useAdminRules({
    category: '',
    keyword: code,
    includeDeleted: true,
  })
  const deleted = row.data?.find((item) => item.code === code)?.deleted ?? false
  // Kept here: the form restarts from the saved values after a save.
  const update = useUpdateRule(code)
  return (
    <QueryState query={rule}>
      {rule.data && (
        <RuleEditForm
          key={`${rule.data.code}-${rule.dataUpdatedAt}`}
          saved={rule.data}
          deleted={deleted}
          created={created}
          update={update}
        />
      )}
    </QueryState>
  )
}

function RuleEditForm({
  saved,
  deleted,
  created,
  update,
}: {
  saved: AdminRuleDetail
  deleted: boolean
  created?: boolean
  update: ReturnType<typeof useUpdateRule>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const remove = useDeleteRule(saved.code)
  const [pending, setPending] = useState<ParsedRuleForm>()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = (noticeChanged: boolean) => {
    if (!pending) return
    update.mutate(toRuleUpdateRequest(pending, saved, noticeChanged), {
      onSuccess: () => setPending(undefined),
    })
  }

  return (
    <Stack gap={16}>
      <Muted>
        {saved.code}
        {saved.noticeChangedAt &&
          ` · ${t('admin.rules.noticeChangedAt', { date: formatDateTime(saved.noticeChangedAt, currentLanguage()) })}`}
      </Muted>
      {deleted && (
        <Notice tone="danger">{t('admin.rules.deletedNotice')}</Notice>
      )}
      {created && !update.isSuccess && (
        <Notice tone="success">{t('admin.rules.created')}</Notice>
      )}
      {update.isSuccess && <Notice tone="success">{t('admin.saved')}</Notice>}
      {!deleted && (
        <Notice tone="note">{t('admin.rules.translationNotice')}</Notice>
      )}
      <RuleFields
        mode="edit"
        saved={saved}
        readOnly={deleted}
        pending={update.isPending}
        error={update.isError ? errorMessage(t, update.error) : undefined}
        // NTF-07: ask before saving whether the member detail shows "안내 변경".
        // Rules send no change notification (BE NotificationService).
        onSave={setPending}
        confirm={
          pending && (
            <Section title={t('admin.rules.noticeQuestion')}>
              <Stack gap={10}>
                <Muted>{t('admin.rules.noticeHelp')}</Muted>
                <Button loading={update.isPending} onClick={() => save(true)}>
                  {t('admin.rules.saveWithNotice')}
                </Button>
                <Button
                  variant="secondary"
                  block
                  loading={update.isPending}
                  onClick={() => save(false)}
                >
                  {t('admin.rules.saveWithoutNotice')}
                </Button>
                <Button
                  variant="text"
                  disabled={update.isPending}
                  onClick={() => setPending(undefined)}
                >
                  {t('admin.cancel')}
                </Button>
              </Stack>
            </Section>
          )
        }
      />
      {!deleted && <RuleTranslations code={saved.code} />}
      {!deleted &&
        (confirmDelete ? (
          <ConfirmPanel
            danger
            message={t('admin.rules.deleteConfirm', { title: saved.title })}
            confirmLabel={t('admin.rules.delete')}
            cancelLabel={t('admin.cancel')}
            pending={remove.isPending}
            onConfirm={() =>
              remove.mutate(undefined, {
                onSuccess: () => navigate('/admin/rules', { replace: true }),
              })
            }
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <Button variant="text" onClick={() => setConfirmDelete(true)}>
            {t('admin.rules.delete')}
          </Button>
        ))}
      {remove.isError && <FormError message={errorMessage(t, remove.error)} />}
    </Stack>
  )
}

/** The rule form shared by create and edit (Korean source text). */
function RuleFields({
  mode,
  saved,
  readOnly,
  pending,
  error,
  onSave,
  confirm,
}: {
  mode: 'create' | 'edit'
  saved: AdminRuleDetail | null
  readOnly?: boolean
  pending: boolean
  error?: string
  onSave: (values: ParsedRuleForm) => void
  /** Shown instead of the save button (edit: the change-notice question). */
  confirm?: ReactNode
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const { register, handleSubmit, formState, control } = useForm<
    RuleForm,
    unknown,
    ParsedRuleForm
  >({
    resolver: zodResolver(
      mode === 'create' ? ruleCreateSchema : ruleFormSchema,
    ),
    defaultValues: toRuleForm(saved),
  })
  const sources = useFieldArray({ control, name: 'sources' })
  const errors = formState.errors
  const onSubmit = handleSubmit(onSave)

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <fieldset
        disabled={readOnly || Boolean(confirm)}
        className={styles.fieldset}
      >
        <Stack gap={14}>
          {mode === 'create' && (
            <TextField
              {...register('code')}
              maxLength={ruleMaxLength.code}
              label={t('admin.rules.code')}
              placeholder="waste-food"
              help={t('admin.rules.codeHelp')}
              error={msg(errors.code?.message)}
            />
          )}
          <Toolbar>
            <TextField
              {...register('category')}
              maxLength={ruleMaxLength.category}
              label={t('admin.rules.category')}
              help={t('admin.rules.categoryHelp')}
              error={msg(errors.category?.message)}
            />
            <TextField
              {...register('sortOrder')}
              inputMode="numeric"
              label={t('admin.rules.sortOrder')}
              error={msg(errors.sortOrder?.message)}
            />
          </Toolbar>
          <CheckField {...register('faq')} label={t('admin.rules.faq')} />
          <TextField
            {...register('title')}
            maxLength={ruleMaxLength.title}
            label={t('admin.fieldTitle')}
            error={msg(errors.title?.message)}
          />
          <TextAreaField
            {...register('summary')}
            maxLength={ruleMaxLength.summary}
            label={t('admin.fieldSummary')}
            error={msg(errors.summary?.message)}
          />
          <TextAreaField
            {...register('points')}
            rows={6}
            label={t('admin.rules.points')}
            error={msg(errors.points?.message)}
          />
          {textFields.map(([field, labelKey, multiline]) => {
            const props = {
              ...register(field),
              maxLength: ruleMaxLength[field],
              label: t(labelKey),
              error: msg(errors[field]?.message),
            }
            return multiline ? (
              <TextAreaField key={field} {...props} />
            ) : (
              <TextField key={field} {...props} />
            )
          })}
          <Section title={t('admin.rules.sources')}>
            <Stack gap={10}>
              {sources.fields.map((source, index) => (
                <Stack key={source.id} gap={6}>
                  <TextField
                    {...register(`sources.${index}.name`)}
                    maxLength={ruleMaxLength.sourceName}
                    label={t('admin.rules.sourceName', { n: index + 1 })}
                    error={msg(errors.sources?.[index]?.name?.message)}
                  />
                  <TextField
                    {...register(`sources.${index}.url`)}
                    type="url"
                    inputMode="url"
                    maxLength={ruleMaxLength.sourceUrl}
                    label={t('admin.rules.sourceUrl', { n: index + 1 })}
                    placeholder="https://"
                    error={msg(errors.sources?.[index]?.url?.message)}
                  />
                  <Button variant="text" onClick={() => sources.remove(index)}>
                    {t('admin.rules.removeSource', { n: index + 1 })}
                  </Button>
                </Stack>
              ))}
              {sources.fields.length < sourcesMaxItems && (
                <Button
                  variant="secondary"
                  onClick={() => sources.append({ name: '', url: '' })}
                >
                  {t('admin.rules.addSource')}
                </Button>
              )}
            </Stack>
          </Section>
          <TextField
            {...register('checkedOn')}
            type="date"
            label={t('admin.rules.checkedOn')}
            error={msg(errors.checkedOn?.message)}
          />
          <FormError message={error} />
          {!readOnly && !confirm && (
            <Button type="submit" loading={pending}>
              {t(mode === 'create' ? 'admin.rules.createSubmit' : 'admin.save')}
            </Button>
          )}
        </Stack>
      </fieldset>
      {confirm}
    </form>
  )
}
