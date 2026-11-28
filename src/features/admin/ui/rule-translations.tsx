import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { FormError, Muted, Notice, Section, Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { GuideTranslationResponse } from '../api'
import {
  ruleTranslationFields,
  ruleTranslationLanguages,
  ruleTranslationSchema,
  toRuleTranslationForm,
  toRuleTranslationRequest,
  type RuleTranslationForm,
  type RuleTranslationLanguage,
} from '../rule-translation-form'
import { ruleMaxLength } from '../rule-form'
import { useGuideTranslation, useSaveGuideTranslation } from '../use-admin'

/**
 * ADM-06 · RUL-10: English, Chinese and Vietnamese text of a living rule,
 * edited on the rule screen (moved from the checklist text screen so a rule
 * is edited in one place). Saving marks the language as human-checked, so
 * the auto-translation after a Korean save no longer replaces it.
 */
export function RuleTranslations({ code }: { code: string }) {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<RuleTranslationLanguage>('en')
  const translation = useGuideTranslation(code, language)
  // Kept here: the form restarts from the saved text after a save.
  const save = useSaveGuideTranslation(code, language)
  return (
    <Section title={t('admin.rules.translationsTitle')}>
      <Stack gap={14}>
        <SelectField
          label={t('admin.language')}
          value={language}
          onChange={(event) => {
            save.reset()
            setLanguage(event.target.value as RuleTranslationLanguage)
          }}
          options={ruleTranslationLanguages.map((value) => ({
            value,
            label: languages[value],
          }))}
        />
        <QueryState query={translation}>
          <RuleTranslationFields
            key={`${language}-${translation.data?.updatedAt ?? 'new'}`}
            language={language}
            saved={translation.data ?? null}
            save={save}
          />
        </QueryState>
      </Stack>
    </Section>
  )
}

function RuleTranslationFields({
  language,
  saved,
  save,
}: {
  language: RuleTranslationLanguage
  saved: GuideTranslationResponse | null
  save: ReturnType<typeof useSaveGuideTranslation>
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const { register, handleSubmit, formState } = useForm<RuleTranslationForm>({
    resolver: zodResolver(ruleTranslationSchema),
    defaultValues: toRuleTranslationForm(saved),
  })
  const onSubmit = handleSubmit((values) =>
    save.mutate(toRuleTranslationRequest(values, saved)),
  )

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack gap={14}>
        {saved ? (
          <>
            <Muted>
              {t('admin.updatedAt', {
                date: formatDateTime(saved.updatedAt, currentLanguage()),
              })}
            </Muted>
            <Notice tone={saved.reviewed ? 'success' : 'note'}>
              {t(
                saved.reviewed
                  ? 'admin.reviewedTranslation'
                  : 'admin.autoTranslation',
              )}
            </Notice>
          </>
        ) : (
          <Notice>{t('admin.newTranslation')}</Notice>
        )}
        {ruleTranslationFields.map(([field, labelKey, multiline]) => {
          const props = {
            ...register(field),
            maxLength: field === 'points' ? undefined : ruleMaxLength[field],
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
        {save.isSuccess && !formState.isDirty && (
          <Notice tone="success">{t('admin.saved')}</Notice>
        )}
        <Button type="submit" variant="secondary" loading={save.isPending}>
          {t('admin.rules.saveTranslation', {
            language: languages[language],
          })}
        </Button>
      </Stack>
    </form>
  )
}
