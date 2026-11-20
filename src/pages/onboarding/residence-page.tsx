import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { residenceOptions } from '@/features/onboarding/draft'
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context'
import type { Residence } from '@/shared/api/types'
import { Button } from '@/shared/ui/button'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { BottomArea } from '@/shared/ui/page'
import { OnboardingStep } from './onboarding-step'
import { onboardingPaths } from './paths'

/** F05 (3/4). Multiple choice; choosing nothing is fine. */
export function ResidencePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, update } = useOnboardingDraft()

  const toggle = (residence: Residence) =>
    update({
      residences: draft.residences.includes(residence)
        ? draft.residences.filter((item) => item !== residence)
        : [...draft.residences, residence],
    })

  return (
    <OnboardingStep
      step={3}
      backTo={onboardingPaths.purpose}
      onSkip={() => {
        update({ residences: [] })
        navigate(onboardingPaths.stayExpiry)
      }}
      title={t('onboarding.residence.title')}
      description={t('onboarding.residence.description')}
    >
      <ChoiceList>
        {residenceOptions.map((residence) => (
          <ChoiceCard
            key={residence}
            indicator="checkbox"
            title={t(`onboarding.residence.${residence}`)}
            selected={draft.residences.includes(residence)}
            onClick={() => toggle(residence)}
          />
        ))}
      </ChoiceList>
      <BottomArea>
        <Button onClick={() => navigate(onboardingPaths.stayExpiry)}>
          {t('common.next')}
        </Button>
      </BottomArea>
    </OnboardingStep>
  )
}
