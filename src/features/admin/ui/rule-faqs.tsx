import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { languages } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { SelectField, TextAreaField, TextField } from '@/shared/ui/field'
import {
  Card,
  FormError,
  Muted,
  Notice,
  Section,
  Stack,
  Tag,
} from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { AdminRuleFaq } from '../rule-api'
import {
  faqLanguages,
  faqMaxLength,
  ruleFaqFormSchema,
  toRuleFaqForm,
  toRuleFaqRequest,
  type RuleFaqForm,
} from '../rule-form'
import {
  useAdminRules,
  useDeleteRuleFaq,
  useRuleFaqs,
  useSaveRuleFaq,
} from '../use-admin-rules'
import styles from './admin.module.css'

/**
 * RUL-04: FAQs written by admins, in order. Members also see rules marked
 * "FAQ" without a written question after these (BE GET /api/rules/faq).
 */
export function RuleFaqList() {
  const { t } = useTranslation()
  const faqs = useRuleFaqs()
  /** undefined = closed, null = new FAQ, number = editing that FAQ. */
  const [editing, setEditing] = useState<number | null>()
  const nextSortOrder =
    Math.max(0, ...(faqs.data ?? []).map((faq) => faq.sortOrder)) + 1

  return (
    <>
      <Notice tone="note">{t('admin.faqs.help')}</Notice>
      {editing === null ? (
        <FaqForm
          saved={null}
          nextSortOrder={nextSortOrder}
          onDone={() => setEditing(undefined)}
        />
      ) : (
        <Button onClick={() => setEditing(null)}>
          {t('admin.faqs.create')}
        </Button>
      )}
      <QueryState query={faqs}>
        {faqs.data?.length === 0 ? (
          <Muted>{t('admin.empty')}</Muted>
        ) : (
          <Stack gap={12}>
            {faqs.data?.map((faq) =>
              editing === faq.faqId ? (
                <FaqForm
                  key={faq.faqId}
                  saved={faq}
                  nextSortOrder={nextSortOrder}
                  onDone={() => setEditing(undefined)}
                />
              ) : (
                <FaqCard
                  key={faq.faqId}
                  faq={faq}
                  onEdit={() => setEditing(faq.faqId)}
                />
              ),
            )}
          </Stack>
        )}
      </QueryState>
    </>
  )
}

function FaqCard({ faq, onEdit }: { faq: AdminRuleFaq; onEdit: () => void }) {
  const { t } = useTranslation()
  const remove = useDeleteRuleFaq(faq.faqId)
  const [confirm, setConfirm] = useState(false)
  const missing = faqLanguages.filter((language) => !faq.translations[language])
  return (
    <Card>
      <Stack gap={8}>
        <Muted>{t('admin.rules.order', { order: faq.sortOrder })}</Muted>
        <strong>{faq.translations.ko?.question}</strong>
        <p className={styles.answer}>{faq.translations.ko?.answer}</p>
        <p className={styles.tags}>
          {faq.ruleCode ? (
            <Tag tone={faq.ruleDeleted ? 'danger' : 'main'}>
              {faq.ruleDeleted
                ? t('admin.faqs.ruleDeleted', { title: faq.ruleTitle })
                : t('admin.faqs.rule', { title: faq.ruleTitle })}
            </Tag>
          ) : (
            <Tag>{t('admin.faqs.noRule')}</Tag>
          )}
          {missing.length > 0 && (
            <Tag tone="warning">
              {t('admin.faqs.missing', {
                languages: missing
                  .map((language) => languages[language])
                  .join(', '),
              })}
            </Tag>
          )}
        </p>
        {confirm ? (
          <ConfirmPanel
            danger
            message={t('admin.faqs.deleteConfirm')}
            confirmLabel={t('admin.faqs.delete')}
            cancelLabel={t('admin.cancel')}
            pending={remove.isPending}
            onConfirm={() => remove.mutate()}
            onCancel={() => setConfirm(false)}
          />
        ) : (
          <>
            <Button variant="secondary" onClick={onEdit}>
              {t('admin.faqs.edit')}
            </Button>
            <Button variant="text" onClick={() => setConfirm(true)}>
              {t('admin.faqs.delete')}
            </Button>
          </>
        )}
        {remove.isError && (
          <FormError message={errorMessage(t, remove.error)} />
        )}
      </Stack>
    </Card>
  )
}

function FaqForm({
  saved,
  nextSortOrder,
  onDone,
}: {
  saved: AdminRuleFaq | null
  nextSortOrder: number
  onDone: () => void
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const save = useSaveRuleFaq(saved?.faqId)
  // Rules to link: the ones not deleted.
  const rules = useAdminRules({
    category: '',
    keyword: '',
    includeDeleted: false,
  })
  const { register, handleSubmit, formState } = useForm<
    RuleFaqForm,
    unknown,
    z.output<typeof ruleFaqFormSchema>
  >({
    resolver: zodResolver(ruleFaqFormSchema),
    defaultValues: toRuleFaqForm(saved, nextSortOrder),
  })
  const errors = formState.errors
  const onSubmit = handleSubmit((values) =>
    save.mutate(toRuleFaqRequest(values), { onSuccess: onDone }),
  )

  return (
    <Card>
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Stack gap={14}>
          <strong>{t(saved ? 'admin.faqs.edit' : 'admin.faqs.create')}</strong>
          {saved?.ruleDeleted && (
            <Notice tone="danger">
              {t('admin.faqs.ruleDeletedNotice', { title: saved.ruleTitle })}
            </Notice>
          )}
          <TextField
            {...register('sortOrder')}
            inputMode="numeric"
            label={t('admin.rules.sortOrder')}
            error={msg(errors.sortOrder?.message)}
          />
          <SelectField
            {...register('ruleCode')}
            label={t('admin.faqs.ruleCode')}
            options={[
              { value: '', label: t('admin.faqs.noRule') },
              ...(rules.data ?? []).map((rule) => ({
                value: rule.code,
                label: `${rule.title} (${rule.code})`,
              })),
            ]}
          />
          {faqLanguages.map((language) => (
            <Section
              key={language}
              title={
                language === 'ko'
                  ? t('admin.faqs.koreanRequired')
                  : t('admin.faqs.optionalLanguage', {
                      language: languages[language],
                    })
              }
            >
              <Stack gap={8}>
                <TextField
                  {...register(`${language}.question`)}
                  maxLength={faqMaxLength.question}
                  label={t('admin.faqs.question')}
                  error={msg(errors[language]?.question?.message)}
                />
                <TextAreaField
                  {...register(`${language}.answer`)}
                  maxLength={faqMaxLength.answer}
                  label={t('admin.faqs.answer')}
                  error={msg(errors[language]?.answer?.message)}
                />
              </Stack>
            </Section>
          ))}
          <FormError
            message={save.isError ? errorMessage(t, save.error) : undefined}
          />
          <Button type="submit" loading={save.isPending}>
            {t('admin.save')}
          </Button>
          <Button variant="text" disabled={save.isPending} onClick={onDone}>
            {t('admin.cancel')}
          </Button>
        </Stack>
      </form>
    </Card>
  )
}
