import type { Question } from '@/features/onboarding/questions'

/** M10 row label for each onboarding answer. */
export const answerLabels: Record<Question, string> = {
  userType: 'me.situation',
  entryDate: 'me.entryDate',
  purpose: 'me.purpose',
  residences: 'me.residences',
  stayExpiry: 'me.stayExpiry',
}
