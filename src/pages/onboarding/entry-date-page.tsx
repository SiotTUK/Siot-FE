import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { isIsoDate } from '@/features/onboarding/draft'
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context'
import { Button } from '@/shared/ui/button'
import { BottomArea, Notice, Stack } from '@/shared/ui/page'
import { TextField } from '@/shared/ui/text-field'
import { OnboardingStep } from './onboarding-step'
import { onboardingPaths } from './paths'

/** F03 (1/4). Both user types are asked; empty or skipped = null. */
export function EntryDatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, update } = useOnboardingDraft()
  const [date, setDate] = useState(draft.entryDate ?? '')
  const [invalid, setInvalid] = useState(false)

  const next = (entryDate: string | null) => {
    update({ entryDate })
    navigate(onboardingPaths.purpose)
  }

  return (
    <OnboardingStep
      step={1}
      backTo={onboardingPaths.userType}
      onSkip={() => next(null)}
      title={t('onboarding.entryDate.title')}
      description={t('onboarding.entryDate.description')}
    >
      <form
        noValidate
        style={{ display: 'contents' }}
        onSubmit={(event) => {
          event.preventDefault()
          if (date && !isIsoDate(date)) return setInvalid(true)
          next(date || null)
        }}
      >
        <Stack gap={16}>
          <TextField
            label={t('onboarding.entryDate.label')}
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setInvalid(false)
            }}
            error={invalid ? t('validation.dateFormat') : undefined}
          />
          <Notice tone="note">{t('onboarding.entryDate.note')}</Notice>
        </Stack>
        <BottomArea>
          <Button type="submit">{t('common.next')}</Button>
        </BottomArea>
      </form>
    </OnboardingStep>
  )
}
