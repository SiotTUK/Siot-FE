import type { TFunction } from 'i18next'
import type { MemberResponse } from '@/shared/api/types'
import { residenceOptions } from './draft'
import type { Question } from './questions'

/**
 * Home "my situation" card (H1/H2), built from the self-reported onboarding answers.
 * e.g. "한국에 처음 입국했어요 · 일하러 왔어요" / "입국일 2026-08-20 · 거주 정보 없음"
 */
export function situationSummary(
  t: TFunction,
  member: Pick<
    MemberResponse,
    'userType' | 'purpose' | 'entryDate' | 'stayExpiry' | 'residences'
  >,
): { title: string; detail: string } {
  const title = [
    member.userType && t(`onboarding.userType.${member.userType}.title`),
    member.purpose && t(`onboarding.purpose.${member.purpose}.title`),
  ]
    .filter(Boolean)
    .join(' · ')

  const residences = residenceOptions
    .filter((option) => member.residences.includes(option))
    .map((option) => t(`onboarding.summary.residenceShort.${option}`))
  const detail = [
    member.entryDate &&
      t('onboarding.summary.entryDate', { date: member.entryDate }),
    member.stayExpiry &&
      t('onboarding.summary.stayExpiry', { date: member.stayExpiry }),
    residences.length > 0
      ? residences.join(', ')
      : t('onboarding.summary.noResidence'),
  ]
    .filter(Boolean)
    .join(' · ')

  return { title, detail }
}

/** One saved answer as text, for M10 rows ("일하러 왔어요", "2026-10-20", "자녀 · 자차"). */
export function describeAnswer(
  t: TFunction,
  question: Question,
  member: Pick<MemberResponse, Question>,
): string {
  const value = member[question]
  if (question === 'residences')
    return (
      residenceOptions
        .filter((option) => member.residences.includes(option))
        .map((option) => t(`onboarding.summary.residenceShort.${option}`))
        .join(' · ') || t('onboarding.summary.noResidence')
    )
  if (!value) return t('onboarding.notEntered')
  if (question === 'userType' || question === 'purpose')
    return t(`onboarding.${question}.${String(value)}.title`)
  return String(value)
}
