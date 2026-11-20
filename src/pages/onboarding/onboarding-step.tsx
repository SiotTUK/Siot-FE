import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context'
import { PageBody } from '@/shared/ui/mobile-frame'
import { PageHeading } from '@/shared/ui/page'
import { StepHeader } from '@/shared/ui/step-header'
import { onboardingPaths } from './paths'

const totalSteps = 4

/** Shared frame for F03~F06: back, skip, `n / 4`, title. */
export function OnboardingStep({
  step,
  backTo,
  onSkip,
  skipDisabled,
  title,
  description,
  children,
}: {
  step: number
  backTo: string
  onSkip: () => void
  skipDisabled?: boolean
  title: string
  description: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft } = useOnboardingDraft()

  // F02 is the only required answer; without it, start from F02.
  if (!draft.userType) return <Navigate to={onboardingPaths.userType} replace />

  return (
    <>
      <StepHeader
        backLabel={t('common.back')}
        onBack={() => navigate(backTo)}
        skipLabel={t('common.skip')}
        onSkip={onSkip}
        skipDisabled={skipDisabled}
        step={{
          current: step,
          total: totalSteps,
          label: t('onboarding.step', { current: step, total: totalSteps }),
        }}
      />
      <PageBody>
        <PageHeading title={title} description={description} />
        {children}
      </PageBody>
    </>
  )
}
