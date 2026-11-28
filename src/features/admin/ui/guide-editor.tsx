import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import type { z } from 'zod'
import type { Language } from '@/shared/api/types'
import { currentLanguage, languages } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button, ButtonLink } from '@/shared/ui/button'
import {
  CheckField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/shared/ui/field'
import {
  FormError,
  Muted,
  Notice,
  Section,
  Stack,
  Toolbar,
} from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { GuideInfoResponse, GuideTranslationResponse } from '../api'
import {
  editableGuides,
  guideKinds,
  guideOptions,
  type EditableGuideKind,
} from '../guide-list'
import {
  toGuideInfoForm,
  guideInfoFormSchema,
  guideInfoMaxLength,
  toGuideInfoRequest,
  type GuideInfoForm,
} from '../guide-info-form'
import {
  guideFields,
  guideFormSchema,
  guideMaxLength,
  toGuideForm,
  toGuideRequest,
  type GuideForm,
} from '../guide-form'
import {
  useGuideInfo,
  useGuides,
  useGuideTranslation,
  useSaveGuideTranslation,
  useUpdateGuideInfo,
} from '../use-admin'

/**
 * CHK-06·NTF-07: edit one language of a guide's detail text by its code:
 * checklist items (CL-01), life change tasks (LC-01-1) and living rules
 * (waste-food). The item is picked from GET /api/admin/guides; if that list
 * cannot load, the code can still be typed (sent as typed, only trimmed,
 * because the BE looks codes up case-sensitively).
 */
export function GuideEditor() {
  const { t } = useTranslation()
  // ADM-06·07: the rule editor and reports open this screen with ?code=.
  const [params] = useSearchParams()
  const initialCode = params.get('code')?.trim() ?? ''
  const [code, setCode] = useState(initialCode)
  const [kind, setKind] = useState<EditableGuideKind | ''>('')
  const [language, setLanguage] = useState<Language>('ko')
  const [target, setTarget] = useState<
    { code: string; language: Language } | undefined
  >(() => (initialCode ? { code: initialCode, language: 'ko' } : undefined))
  const guides = useGuides()
  // ADM-06: living rules are edited on the rule screen only.
  const targetRule = guides.data?.some(
    (item) => item.code === target?.code && item.kind === 'RULE',
  )
  const guide = useGuideTranslation(
    targetRule ? undefined : target?.code,
    target?.language ?? 'ko',
  )

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (code.trim()) setTarget({ code: code.trim(), language })
        }}
      >
        <Stack gap={12}>
          {guides.isError ? (
            <>
              <FormError message={errorMessage(t, guides.error)} />
              <TextField
                label={t('admin.code')}
                placeholder="CL-01 · waste-food"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </>
          ) : (
            <>
              <SelectField
                label={t('admin.guideKind')}
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as EditableGuideKind | '')
                  setCode('')
                }}
                options={[
                  { value: '', label: t('admin.all') },
                  ...guideKinds.map((value) => ({
                    value,
                    label: t(`admin.guideKinds.${value}`),
                  })),
                ]}
              />
              <SelectField
                label={t('admin.guideItem')}
                value={code}
                disabled={guides.isPending}
                onChange={(event) => setCode(event.target.value)}
                options={guideOptions(
                  editableGuides(guides.data ?? []),
                  kind,
                  code,
                  t(guides.isPending ? 'common.loading' : 'admin.guidePick'),
                )}
              />
            </>
          )}
          <Toolbar>
            <SelectField
              label={t('admin.language')}
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              options={Object.entries(languages).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Button type="submit" variant="secondary" disabled={!code.trim()}>
              {t('admin.load')}
            </Button>
          </Toolbar>
        </Stack>
      </form>
      {target && targetRule && (
        <Notice tone="note">
          <Stack gap={8}>
            {t('admin.ruleMoved')}
            <ButtonLink
              variant="secondary"
              to={`/admin/rules/${encodeURIComponent(target.code)}`}
            >
              {t('admin.openRule')}
            </ButtonLink>
          </Stack>
        </Notice>
      )}
      {target && !targetRule && (
        <QueryState query={guide}>
          <GuideInfoEditor key={target.code} code={target.code} />
          <GuideTextForm
            key={`${target.code}-${target.language}-${guide.data?.updatedAt ?? 'new'}`}
            code={target.code}
            language={target.language}
            saved={guide.data ?? null}
          />
        </QueryState>
      )}
    </>
  )
}

/**
 * CHK-06·NTF-07 source link and contact, shared by every language. The
 * fields start with the saved values (GET /api/admin/guides/{code}); only
 * changed fields are sent, and an emptied field clears the value.
 */
function GuideInfoEditor({ code }: { code: string }) {
  const { t } = useTranslation()
  const info = useGuideInfo(code)
  // Kept here: the fields restart from the saved values after a save.
  const update = useUpdateGuideInfo(code)
  return (
    <Section title={t('admin.guideInfo.title')}>
      <QueryState query={info}>
        {info.data && (
          <GuideInfoFields
            key={info.data.updatedAt ?? 'never'}
            saved={info.data}
            update={update}
          />
        )}
      </QueryState>
    </Section>
  )
}

function GuideInfoFields({
  saved,
  update,
}: {
  saved: GuideInfoResponse
  update: ReturnType<typeof useUpdateGuideInfo>
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const { register, handleSubmit, formState, setError } = useForm<
    GuideInfoForm,
    unknown,
    z.output<typeof guideInfoFormSchema>
  >({
    resolver: zodResolver(guideInfoFormSchema),
    defaultValues: toGuideInfoForm(saved),
  })
  const onSubmit = handleSubmit((values) => {
    const body = toGuideInfoRequest(values, saved)
    if (Object.keys(body).length === 0)
      return setError('root', { message: 'admin.guideInfo.nothingChanged' })
    update.mutate(body)
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack gap={14}>
        {saved.updatedAt && (
          <Muted>
            {t('admin.updatedAt', {
              date: formatDateTime(saved.updatedAt, currentLanguage()),
            })}
          </Muted>
        )}
        <TextField
          {...register('sourceUrl')}
          type="url"
          inputMode="url"
          maxLength={guideInfoMaxLength.sourceUrl}
          label={t('admin.guideInfo.sourceUrl')}
          placeholder={t('admin.guideInfo.empty')}
          help={t('admin.guideInfo.blankClears')}
          error={msg(formState.errors.sourceUrl?.message)}
        />
        <TextField
          {...register('contact')}
          type="tel"
          maxLength={guideInfoMaxLength.contact}
          label={t('admin.guideInfo.contact')}
          placeholder={t('admin.guideInfo.empty')}
          help={t('admin.guideInfo.blankClears')}
          error={msg(formState.errors.contact?.message)}
        />
        <FormError
          message={
            msg(formState.errors.root?.message) ??
            (update.isError ? errorMessage(t, update.error) : undefined)
          }
        />
        {update.isSuccess && !formState.isDirty && (
          <Notice tone="success">{t('admin.saved')}</Notice>
        )}
        <Button type="submit" variant="secondary" loading={update.isPending}>
          {t('admin.guideInfo.save')}
        </Button>
      </Stack>
    </form>
  )
}

function GuideTextForm({
  code,
  language,
  saved,
}: {
  code: string
  language: Language
  saved: GuideTranslationResponse | null
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const save = useSaveGuideTranslation(code, language)
  const { register, handleSubmit, formState } = useForm<GuideForm>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: toGuideForm(saved),
  })
  const onSubmit = handleSubmit((values) => save.mutate(toGuideRequest(values)))

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack gap={14}>
        <Muted>
          {code} · {languages[language]}
          {saved &&
            ` · ${t('admin.updatedAt', { date: formatDateTime(saved.updatedAt, currentLanguage()) })}`}
        </Muted>
        {!saved && <Notice>{t('admin.newTranslation')}</Notice>}
        {/* BE #23: auto-translations are replaced when Korean changes. */}
        {saved && language !== 'ko' && (
          <Notice tone={saved.reviewed ? 'success' : 'note'}>
            {t(
              saved.reviewed
                ? 'admin.reviewedTranslation'
                : 'admin.autoTranslation',
            )}
          </Notice>
        )}
        {language === 'ko' && (
          <Notice tone="note">{t('admin.koreanRegenerates')}</Notice>
        )}
        {guideFields.map(([field, labelKey, multiline]) => {
          const props = {
            ...register(field),
            maxLength: field === 'docs' ? undefined : guideMaxLength[field],
            label: t(labelKey),
            error: msg(formState.errors[field]?.message),
          }
          return multiline ? (
            <TextAreaField key={field} {...props} />
          ) : (
            <TextField key={field} {...props} />
          )
        })}
        <CheckField
          {...register('noticeChanged')}
          label={t('admin.noticeChanged')}
        />
        {save.isError && <FormError message={errorMessage(t, save.error)} />}
        <Button type="submit" loading={save.isPending}>
          {t(save.isSuccess ? 'admin.saved' : 'admin.save')}
        </Button>
      </Stack>
    </form>
  )
}
