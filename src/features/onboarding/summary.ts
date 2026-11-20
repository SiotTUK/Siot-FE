import type { TFunction } from 'i18next'
import type { MemberResponse } from '@/shared/api/types'
import { residenceOptions } from './draft'

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
    .map((option) => t(`home.residenceShort.${option}`))
  const detail = [
    member.entryDate && t('home.entryDate', { date: member.entryDate }),
    member.stayExpiry && t('home.stayExpiry', { date: member.stayExpiry }),
    residences.length > 0 ? residences.join(', ') : t('home.noResidence'),
  ]
    .filter(Boolean)
    .join(' · ')

  return { title, detail }
}
