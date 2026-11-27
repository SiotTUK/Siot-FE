import {
  BabyIcon,
  BriefcaseIcon,
  CarIcon,
  HouseArrowIcon,
  IdCardIcon,
  PlaneIcon,
  SchoolIcon,
  UsersIcon,
} from '@/shared/ui/icons'
import type { LifeChangeCode } from '../life-changes'

const icons = {
  'LC-01': HouseArrowIcon,
  'LC-02': BriefcaseIcon,
  'LC-03': SchoolIcon,
  'LC-04': CarIcon,
  'LC-05': BabyIcon,
  'LC-06': UsersIcon,
  'LC-07': PlaneIcon,
  'LC-08': IdCardIcon,
} satisfies Record<LifeChangeCode, unknown>

/** Line icon per life change (Figma v2 F06a list). Decorative. */
export function LifeChangeIcon({ code }: { code: LifeChangeCode }) {
  const Icon = icons[code]
  return <Icon />
}
