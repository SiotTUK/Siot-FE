import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { stayPurposes } from '@/features/onboarding/draft'
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context'
import type { StayPurpose } from '@/shared/api/types'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { BottomArea } from '@/shared/ui/page'
import styles from '../pages.module.css'
import { OnboardingStep } from './onboarding-step'
import { onboardingPaths } from './paths'

/** F04 (2/4). One choice, moves on immediately. Skip sends null (BE treats it as OTHER). */
export function PurposePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, update } = useOnboardingDraft()

  const next = (purpose: StayPurpose | null) => {
    update({ purpose })
    navigate(onboardingPaths.residence)
  }

  return (
    <OnboardingStep
      step={2}
      backTo={onboardingPaths.entryDate}
      onSkip={() => next(null)}
      title={t('onboarding.purpose.title')}
      description={t('onboarding.purpose.description')}
    >
      <ChoiceList>
        {stayPurposes.map((purpose) => (
          <ChoiceCard
            key={purpose}
            title={t(`onboarding.purpose.${purpose}.title`)}
            description={t(`onboarding.purpose.${purpose}.description`)}
            selected={draft.purpose === purpose}
            onClick={() => next(purpose)}
          />
        ))}
      </ChoiceList>
      <BottomArea>
        <p className={styles.hint}>{t('onboarding.autoNext')}</p>
      </BottomArea>
    </OnboardingStep>
  )
}
