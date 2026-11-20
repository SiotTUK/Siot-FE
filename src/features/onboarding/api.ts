import { apiRequest } from '@/shared/api/client'
import type { MemberResponse } from '@/shared/api/types'
import type { OnboardingRequest } from './draft'

export function saveOnboarding(body: OnboardingRequest) {
  return apiRequest<MemberResponse>('/api/members/me/onboarding', {
    method: 'PUT',
    body,
  })
}
