import { Icon } from '@/shared/ui/icons'
import type { RuleCategory } from '../rules'
import { CategoryIcon } from './category-icon'

/**
 * Line icon per rule (Figma v2 rule cards); codes without one (rules the BE
 * added later) use the category icon.
 */
const paths: Record<string, string> = {
  // speaker
  'order-noise':
    'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  // cigarette, crossed out
  'order-smoking':
    'M2 2l20 20M3 13h10M17 13h4v4h-4M3 13v4h12M18 8c0-2.5-2-2.5-2-5M21 8c0-2.5-2-2.5-2-5',
  // trash can
  'waste-general': 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5',
  // apple core: food
  'waste-food':
    'M12 6c-3-3-8-1-8 5 0 5 3 10 6 10 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-5 6-10 0-6-5-8-8-5zM12 6c0-2 1-3 3-4',
  // recycling arrows
  'waste-recycle':
    'M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7l4-6.8M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1M14 16l-3 3 3 3M8.3 13.6 7.2 9.5l-4.1 1.1M9.3 5.6l1.2-2a1.8 1.8 0 0 1 3.1 0l3.9 6.8M13.4 9.4l4.1-1.1-1.1-4.1',
  // sofa: bulky waste
  'waste-bulky':
    'M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2',
  // P sign
  'traffic-parking': 'M4 3h16v18H4zM9 17V7h4a3 3 0 0 1 0 6H9',
  // bell
  'traffic-alert':
    'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
  // ID card: resident tax
  'tax-resident':
    'M3 5h18v14H3zM8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 9h4M14 13h4',
  // house: property tax
  'tax-property': 'M3 10 12 3l9 7v11H3zM9 21v-6h6v6',
  // car: car tax
  'tax-car': 'M3 17v-6l2-5h14l2 5v6zM3 11h18M7 17v2M17 17v2M7 14h.01M17 14h.01',
  // card: paying
  'tax-payment': 'M2 5h20v14H2zM2 10h20M6 15h4',
  // wallet: local currency
  'living-siru':
    'M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3zM3 7l12-4v4M17 13h.01',
  // bicycle
  'living-bike':
    'M2 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0M16 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0M5 17l4-8h5l5 8M12 17 9 9M9 9H7M14 9l1-3h2',
  // phone
  'support-1345':
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  // building
  'support-welfare-center':
    'M4 21V5l8-3 8 3v16M2 21h20M9 21v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01',
  // two people: family
  'support-family':
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  // briefcase: work
  'support-work': 'M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
}

export function RuleIcon({
  code,
  category,
}: {
  code: string
  /** null: a category added by an admin, shown with the 생활 편의 icon. */
  category: RuleCategory | null
}) {
  const path = paths[code]
  if (!path) return <CategoryIcon category={category ?? 'living'} />
  return (
    <Icon>
      <path d={path} />
    </Icon>
  )
}
