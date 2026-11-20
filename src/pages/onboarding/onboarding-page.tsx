import { Navigate, useParams } from 'react-router-dom'
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context'
import { onboardingPath, questionByPath } from '@/features/onboarding/questions'
import { QuestionScreen } from '@/features/onboarding/ui/question-screen'

/** `/onboarding/:question` — F02~F06, driven by the question table. */
export function OnboardingPage() {
  const question = questionByPath(useParams().question)
  const { draft } = useOnboardingDraft()
  // F02 is the only required answer; without it, start from F02.
  if (!question || (question !== 'userType' && !draft.userType))
    return <Navigate to={onboardingPath('userType')} replace />
  return <QuestionScreen key={question} question={question} />
}
