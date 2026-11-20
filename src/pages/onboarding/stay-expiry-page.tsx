import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { meQueryKey } from '@/features/auth/api'
import { saveOnboarding } from '@/features/onboarding/api'
import { isIsoDate, toOnboardingRequest } from '@/features/onboarding/draft'
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context'
import { ApiError } from '@/shared/api/client'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { BottomArea, FormError, Notice, Stack } from '@/shared/ui/page'
import { TextField } from '@/shared/ui/text-field'
import { OnboardingStep } from './onboarding-step'
import { onboardingPaths } from './paths'

/** F06 (4/4). Saves all five answers at once, then goes to /home. */
export function StayExpiryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { draft, update, clear } = useOnboardingDraft()
  const [date, setDate] = useState(draft.stayExpiry ?? '')
  const [invalid, setInvalid] = useState(false)

  const save = useMutation({
    mutationFn: saveOnboarding,
    onSuccess: (member) => {
      queryClient.setQueryData(meQueryKey, member)
      navigate('/home', { replace: true })
      clear()
    },
    onError: (error) => {
      // Session expired: the route guard sends the member to login.
      if (error instanceof ApiError && error.status === 401)
        queryClient.setQueryData(meQueryKey, null)
    },
  })

  const finish = (stayExpiry: string | null) => {
    update({ stayExpiry })
    const request = toOnboardingRequest({ ...draft, stayExpiry })
    if (!request) return navigate(onboardingPaths.userType, { replace: true })
    save.mutate(request)
  }

  return (
    <OnboardingStep
      step={4}
      backTo={onboardingPaths.residence}
      onSkip={() => finish(null)}
      skipDisabled={save.isPending}
      title={t('onboarding.stayExpiry.title')}
      description={t('onboarding.stayExpiry.description')}
    >
      <form
        noValidate
        style={{ display: 'contents' }}
        onSubmit={(event) => {
          event.preventDefault()
          if (date && !isIsoDate(date)) return setInvalid(true)
          finish(date || null)
        }}
      >
        <Stack gap={16}>
          <TextField
            label={t('onboarding.stayExpiry.label')}
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setInvalid(false)
            }}
            error={invalid ? t('validation.dateFormat') : undefined}
          />
          <Notice tone="note">{t('onboarding.stayExpiry.note')}</Notice>
        </Stack>
        <BottomArea>
          <Stack gap={12}>
            {save.isError && (
              <FormError message={errorMessage(t, save.error)} />
            )}
            <Button type="submit" loading={save.isPending}>
              {t('onboarding.stayExpiry.submit')}
            </Button>
          </Stack>
        </BottomArea>
      </form>
    </OnboardingStep>
  )
}
