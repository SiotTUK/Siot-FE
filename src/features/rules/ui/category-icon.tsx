import { Icon } from '@/shared/ui/icons'
import type { RuleCategory } from '../rules'

/** Line icon for each built-in 분야 (20px, currentColor), as in Figma v2 M06. */
const paths: Record<RuleCategory, string> = {
  // two people: public order and manners
  order:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  // trash can
  waste: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5',
  // car
  traffic: 'M3 17v-6l2-5h14l2 5v6zM3 11h18M7 17v2M17 17v2M7 14h.01M17 14h.01',
  // won coin
  tax: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M7 9l2 7 3-6 3 6 2-7M6.5 12h11',
  // bus
  living:
    'M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2M4 11h16M7 17v3M17 17v3M8 14h.01M16 14h.01',
  // open book
  support:
    'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
}

/** Default document icon for admin-added categories (`key: null`, #132). */
const fallbackPath =
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'

export function CategoryIcon({
  category,
  className,
}: {
  category: RuleCategory | null
  className?: string
}) {
  return (
    <Icon className={className}>
      <path d={category ? paths[category] : fallbackPath} />
    </Icon>
  )
}
