import { Icon } from '@/shared/ui/icons'
import type { RuleCategory } from '../rules'

/** Line icon for each 분야 card (20px, currentColor). */
const paths: Record<RuleCategory, string> = {
  // speaker: noise and public order
  order: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  // trash can
  waste: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5',
  // car
  traffic: 'M3 17v-6l2-5h14l2 5v6zM3 11h18M7 17v2M17 17v2M7 14h.01M17 14h.01',
  // receipt
  tax: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  // house
  living: 'M3 10 12 3l9 7v11H3zM9 21v-6h6v6',
  // phone
  support:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
}

export function CategoryIcon({
  category,
  className,
}: {
  category: RuleCategory
  className?: string
}) {
  return (
    <Icon className={className}>
      <path d={paths[category]} />
    </Icon>
  )
}
