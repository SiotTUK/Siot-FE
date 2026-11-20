import { createContext, useContext } from 'react'
import type { OnboardingDraft } from './draft'

export interface OnboardingContextValue {
  draft: OnboardingDraft
  update: (patch: Partial<OnboardingDraft>) => void
  /** Forget the stored draft after it was saved to the server. */
  clear: () => void
}

export const OnboardingContext = createContext<
  OnboardingContextValue | undefined
>(undefined)

export function useOnboardingDraft(): OnboardingContextValue {
  const value = useContext(OnboardingContext)
  if (!value)
    throw new Error('useOnboardingDraft must be used inside OnboardingProvider')
  return value
}
