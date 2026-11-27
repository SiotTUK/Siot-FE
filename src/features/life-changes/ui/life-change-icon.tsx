import { Icon } from '@/shared/ui/icons'
import type { LifeChangeCode } from '../life-changes'

/** Line icon for each life change (20px, currentColor), as in Figma v2 F06a. */
const paths: Record<LifeChangeCode, string> = {
  // house: moved
  'LC-01': 'M3 10.5 12 3l9 7.5M5 9v11h14V9M10 20v-6h4v6',
  // briefcase: new job
  'LC-02': 'M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18',
  // graduation cap: school
  'LC-03': 'M2 9l10-5 10 5-10 5zM6 11v5c2 2 10 2 12 0v-5M22 9v6',
  // car: bought a car
  'LC-04': 'M3 17v-6l2-5h14l2 5v6zM3 11h18M7 17v2M17 17v2M7 14h.01M17 14h.01',
  // person: a baby was born
  'LC-05': 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
  // two people: family is coming
  'LC-06':
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  // paper plane: leaving Korea for a while
  'LC-07': 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  // ID card: name or passport changed
  'LC-08':
    'M3 5h18v14H3zM8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 16a3 3 0 0 1 6 0M14 9h4M14 13h4',
}

export function LifeChangeTypeIcon({ code }: { code: LifeChangeCode }) {
  return (
    <Icon>
      <path d={paths[code]} />
    </Icon>
  )
}
