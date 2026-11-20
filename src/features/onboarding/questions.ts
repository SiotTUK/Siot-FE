import {
  residenceOptions,
  stayPurposes,
  userTypes,
  type OnboardingDraft,
} from './draft'

export type Question = keyof OnboardingDraft

type QuestionSpec = {
  /** `/onboarding/{path}` */
  path: string
  /** i18n key under `onboarding.` */
  textKey: string
  kind: 'single' | 'multi' | 'date'
  options?: readonly string[]
  /** `n / 4` progress; F02 has none. */
  step?: number
}

/** F02~F06 in order. Screens and M10 editing are driven by this table. */
export const questions: Record<Question, QuestionSpec> = {
  userType: {
    path: 'type',
    textKey: 'userType',
    kind: 'single',
    options: userTypes,
  },
  entryDate: {
    path: 'entry-date',
    textKey: 'entryDate',
    kind: 'date',
    step: 1,
  },
  purpose: {
    path: 'purpose',
    textKey: 'purpose',
    kind: 'single',
    options: stayPurposes,
    step: 2,
  },
  residences: {
    path: 'residence',
    textKey: 'residence',
    kind: 'multi',
    options: residenceOptions,
    step: 3,
  },
  stayExpiry: {
    path: 'stay-expiry',
    textKey: 'stayExpiry',
    kind: 'date',
    step: 4,
  },
}

export const questionOrder = Object.keys(questions) as Question[]
export const stepCount = 4

export function questionByPath(path: string | undefined) {
  return questionOrder.find((question) => questions[question].path === path)
}

export const onboardingPath = (question: Question) =>
  `/onboarding/${questions[question].path}`
