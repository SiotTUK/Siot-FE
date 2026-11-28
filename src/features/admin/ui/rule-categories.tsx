import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import type { Language } from '@/shared/api/types'
import { languages } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/field'
import { Card, FormError, Muted, Notice, Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { AdminRuleCategory } from '../rule-api'
import {
  useRenameRuleCategory,
  useRuleCategories,
  useSaveRuleCategoryTranslation,
} from '../use-admin-rules'

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'admin.categories.nameRequired')
    .max(100, 'admin.tooLong'),
})
type NameForm = z.input<typeof nameSchema>

const translated = ['en', 'zh', 'vi'] as const satisfies readonly Exclude<
  Language,
  'ko'
>[]

/**
 * RUL-12·13: categories exist while they have rules. Renaming moves every
 * rule (and merges into a category of that name); the BE re-translates it.
 */
export function RuleCategoryList() {
  const { t } = useTranslation()
  const categories = useRuleCategories()
  return (
    <>
      <Notice tone="note">{t('admin.categories.help')}</Notice>
      <QueryState query={categories}>
        {categories.data?.length === 0 ? (
          <Muted>{t('admin.empty')}</Muted>
        ) : (
          <Stack gap={12}>
            {categories.data?.map((category) => (
              <CategoryCard key={category.category} category={category} />
            ))}
          </Stack>
        )}
      </QueryState>
    </>
  )
}

function CategoryCard({ category }: { category: AdminRuleCategory }) {
  const { t } = useTranslation()
  return (
    <Card>
      <Stack gap={12}>
        <strong>
          {category.category} ·{' '}
          {t('admin.categories.ruleCount', { count: category.ruleCount })}
        </strong>
        <RenameForm category={category.category} />
        {translated.map((language) => (
          <TranslationForm
            // A save returns new names; restart from them.
            key={`${language}-${category.translations[language] ?? ''}`}
            category={category.category}
            language={language}
            saved={category.translations[language]}
          />
        ))}
      </Stack>
    </Card>
  )
}

function RenameForm({ category }: { category: string }) {
  const { t } = useTranslation()
  const msg = useMessage()
  const rename = useRenameRuleCategory(category)
  const { register, handleSubmit, formState } = useForm<
    NameForm,
    unknown,
    z.output<typeof nameSchema>
  >({ resolver: zodResolver(nameSchema), defaultValues: { name: category } })
  const onSubmit = handleSubmit(({ name }) => {
    if (name !== category) rename.mutate(name)
  })
  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack gap={8}>
        <TextField
          {...register('name')}
          maxLength={100}
          label={t('admin.categories.koreanName')}
          help={t('admin.categories.renameHelp')}
          error={msg(formState.errors.name?.message)}
        />
        <FormError
          message={rename.isError ? errorMessage(t, rename.error) : undefined}
        />
        <Button type="submit" variant="secondary" loading={rename.isPending}>
          {t('admin.categories.rename')}
        </Button>
      </Stack>
    </form>
  )
}

function TranslationForm({
  category,
  language,
  saved,
}: {
  category: string
  language: (typeof translated)[number]
  saved: string | undefined
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const save = useSaveRuleCategoryTranslation(category)
  const { register, handleSubmit, formState } = useForm<
    NameForm,
    unknown,
    z.output<typeof nameSchema>
  >({ resolver: zodResolver(nameSchema), defaultValues: { name: saved ?? '' } })
  const onSubmit = handleSubmit(({ name }) => save.mutate({ language, name }))
  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack gap={8}>
        <TextField
          {...register('name')}
          maxLength={100}
          label={t('admin.categories.translatedName', {
            language: languages[language],
          })}
          placeholder={saved ? undefined : t('admin.categories.noTranslation')}
          error={msg(formState.errors.name?.message)}
        />
        <FormError
          message={save.isError ? errorMessage(t, save.error) : undefined}
        />
        <Button type="submit" variant="text" loading={save.isPending}>
          {t('admin.categories.saveTranslation', {
            language: languages[language],
          })}
        </Button>
      </Stack>
    </form>
  )
}
