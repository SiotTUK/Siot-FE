import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { Language } from '@/shared/api/types'
import { currentLanguage, languages } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import {
  CheckField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/shared/ui/field'
import { FormError, Muted, Notice, Stack, Toolbar } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { GuideTranslationResponse } from '../api'
import {
  guideFields,
  guideFormSchema,
  guideMaxLength,
  toGuideForm,
  toGuideRequest,
  type GuideForm,
} from '../guide-form'
import { useGuideTranslation, useSaveGuideTranslation } from '../use-admin'

/**
 * CHK-06·NTF-07: edit one language of a guide's detail text by its code:
 * checklist items (CL-01), life change tasks (LC-01-1) and living rules
 * (waste-food). The BE looks codes up case-sensitively, so the code is sent
 * as typed (only trimmed). Picking living rules from GET /api/admin/rules
 * belongs to the admin rules screen (#43).
 */
export function GuideEditor() {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<Language>('ko')
  const [target, setTarget] = useState<{ code: string; language: Language }>()
  const guide = useGuideTranslation(target?.code, target?.language ?? 'ko')

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (code.trim()) setTarget({ code: code.trim(), language })
        }}
      >
        <Toolbar>
          <TextField
            label={t('admin.code')}
            placeholder="CL-01 · waste-food"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <SelectField
            label={t('admin.language')}
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            options={Object.entries(languages).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Button type="submit" variant="secondary">
            {t('admin.load')}
          </Button>
        </Toolbar>
      </form>
      {target && (
        <QueryState query={guide}>
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
