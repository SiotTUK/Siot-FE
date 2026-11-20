import { useTranslation } from 'react-i18next'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { TextField } from '@/shared/ui/field'
import { Notice, Stack } from '@/shared/ui/page'
import type { OnboardingDraft } from '../draft'
import { questions, type Question } from '../questions'

type Value = OnboardingDraft[Question]

/**
 * The input for one onboarding answer, shared by F02~F06 and M10 editing.
 * Single choice reports the picked option, multi toggles, date edits text.
 */
export function AnswerInput({
  question,
  value,
  error,
  onChange,
}: {
  question: Question
  value: Value
  error?: string
  onChange: (value: Value) => void
}) {
  const { t } = useTranslation()
  const { kind, textKey, options = [] } = questions[question]
  const text = (key: string) => t(`onboarding.${textKey}.${key}`)

  if (kind === 'date')
    return (
      <Stack gap={16}>
        <TextField
          label={text('label')}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value || null)}
          error={error}
        />
        <Notice tone="note">{text('note')}</Notice>
      </Stack>
    )

  const selected = Array.isArray(value) ? value : [value]
  return (
    <ChoiceList>
      {options.map((option) => (
        <ChoiceCard
          key={option}
          indicator={kind === 'multi' ? 'checkbox' : 'radio'}
          // Residences have one line; user types and purposes have two.
          title={kind === 'multi' ? text(option) : text(`${option}.title`)}
          description={
            kind === 'multi' ? undefined : text(`${option}.description`)
          }
          selected={selected.includes(option)}
          onClick={() =>
            onChange(
              (kind === 'multi'
                ? selected.includes(option)
                  ? selected.filter((item) => item !== option)
                  : [...selected, option]
                : option) as Value,
            )
          }
        />
      ))}
    </ChoiceList>
  )
}
