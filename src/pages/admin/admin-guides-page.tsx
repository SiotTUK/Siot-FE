import { useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { GuideTranslationResponse } from '@/features/admin/api'
import {
  toGuideForm,
  toGuideRequest,
  type GuideForm,
} from '@/features/admin/guide-form'
import {
  useGuideTranslation,
  useSaveGuideTranslation,
} from '@/features/admin/use-admin'
import type { Language } from '@/shared/api/types'
import { currentLanguage, languages } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { PageLoader } from '@/shared/ui/mobile-frame'
import { FormError, Notice } from '@/shared/ui/page'
import { AdminScreen } from './admin-layout'
import styles from './admin.module.css'

/**
 * CHK-06·NTF-07: edit one language of a checklist item's detail text.
 * There is no item list API yet, so the code (CL-01, LC-01-1 ...) is typed in.
 */
export function AdminGuidesPage() {
  const { t } = useTranslation()
  const [codeInput, setCodeInput] = useState('')
  const [target, setTarget] = useState<{ code: string; language: Language }>()
  const [languageInput, setLanguageInput] = useState<Language>('ko')
  const guide = useGuideTranslation(target?.code, target?.language ?? 'ko')

  return (
    <AdminScreen title={t('admin.menuGuides')} backTo="/admin">
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault()
          const code = codeInput.trim().toUpperCase()
          if (code) setTarget({ code, language: languageInput })
        }}
      >
        <label className={styles.filterField}>
          <span>{t('admin.code')}</span>
          <input
            value={codeInput}
            placeholder="CL-01"
            onChange={(event) => setCodeInput(event.target.value)}
          />
        </label>
        <label className={styles.filterField}>
          <span>{t('admin.language')}</span>
          <select
            value={languageInput}
            onChange={(event) =>
              setLanguageInput(event.target.value as Language)
            }
          >
            {(Object.keys(languages) as Language[]).map((code) => (
              <option key={code} value={code}>
                {languages[code]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary">
          {t('admin.load')}
        </Button>
      </form>

      {target &&
        (guide.isPending ? (
          <PageLoader label={t('common.loading')} />
        ) : guide.isError ? (
          <FormError message={errorMessage(t, guide.error)} />
        ) : (
          <GuideEditor
            key={`${target.code}-${target.language}-${guide.data?.updatedAt ?? 'new'}`}
            code={target.code}
            language={target.language}
            saved={guide.data}
          />
        ))}
    </AdminScreen>
  )
}

const textFields = [
  ['title', 'admin.fieldTitle', 'input'],
  ['badge', 'admin.fieldBadge', 'input'],
  ['summary', 'admin.fieldSummary', 'textarea'],
  ['content', 'admin.fieldContent', 'textarea'],
  ['place', 'admin.fieldPlace', 'textarea'],
  ['docs', 'admin.fieldDocs', 'textarea'],
  ['fee', 'admin.fieldFee', 'input'],
  ['law', 'admin.fieldLaw', 'input'],
  ['penalty', 'admin.fieldPenalty', 'textarea'],
  ['sourceName', 'admin.fieldSourceName', 'input'],
] as const

function GuideEditor({
  code,
  language,
  saved,
}: {
  code: string
  language: Language
  saved: GuideTranslationResponse | null
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<GuideForm>(() => toGuideForm(saved))
  const [titleMissing, setTitleMissing] = useState(false)
  const save = useSaveGuideTranslation(code, language)

  const set =
    (field: Exclude<keyof GuideForm, 'noticeChanged'>) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }))

  return (
    <form
      className={styles.guideForm}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!form.title.trim()) return setTitleMissing(true)
        save.mutate(toGuideRequest(form))
      }}
    >
      <p className={styles.muted}>
        {code} · {languages[language]}
        {saved &&
          ` · ${t('admin.updatedAt', { date: formatDateTime(saved.updatedAt, currentLanguage()) })}`}
      </p>
      {saved === null && (
        <Notice tone="info">{t('admin.newTranslation')}</Notice>
      )}
      {textFields.map(([field, labelKey, kind]) => (
        <label key={field} className={styles.filterField}>
          <span>{t(labelKey)}</span>
          {kind === 'input' ? (
            <input
              value={form[field]}
              onChange={set(field)}
              aria-invalid={
                field === 'title' && titleMissing ? true : undefined
              }
            />
          ) : (
            <textarea rows={3} value={form[field]} onChange={set(field)} />
          )}
          {field === 'title' && titleMissing && (
            <FormError message={t('admin.titleRequired')} />
          )}
        </label>
      ))}
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={form.noticeChanged}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              noticeChanged: event.target.checked,
            }))
          }
        />
        {t('admin.noticeChanged')}
      </label>
      {save.isError && <FormError message={errorMessage(t, save.error)} />}
      <div className={styles.actions}>
        {save.isSuccess && (
          <span className={styles.saved} role="status">
            {t('admin.saved')}
          </span>
        )}
        <Button type="submit" loading={save.isPending}>
          {t('admin.save')}
        </Button>
      </div>
    </form>
  )
}
