import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { userTypes } from '@/features/onboarding/draft'
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { PageBody } from '@/shared/ui/mobile-frame'
import { BottomArea, PageHeading } from '@/shared/ui/page'
import styles from '../pages.module.css'
import { onboardingPaths } from './paths'

/**
 * F02. Tapping a choice moves on immediately. No back button: the previous
 * screen is signup/login, which a logged-in member cannot return to.
 */
export function UserTypePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, update } = useOnboardingDraft()

  return (
    <PageBody className={styles.onboardingTop}>
      <PageHeading
        title={t('onboarding.userType.title')}
        description={t('onboarding.userType.description')}
      />
      <ChoiceList>
        {userTypes.map((userType) => (
          <ChoiceCard
            key={userType}
            title={t(`onboarding.userType.${userType}.title`)}
            description={t(`onboarding.userType.${userType}.description`)}
            selected={draft.userType === userType}
            onClick={() => {
              update({ userType })
              navigate(onboardingPaths.entryDate)
            }}
          />
        ))}
      </ChoiceList>
      <BottomArea>
        <p className={styles.hint}>{t('onboarding.autoNext')}</p>
      </BottomArea>
    </PageBody>
  )
}
