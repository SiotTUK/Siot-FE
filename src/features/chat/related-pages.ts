import { isEventId } from '@/features/events/event-routes'
import { isLifeChangeCode } from '@/features/life-changes/life-changes'
import { isRuleCode } from '@/features/rules/rules'
import type { RelatedPage } from './api'

/**
 * Screen for a chat related page (CB-10). Codes only get a shape check here;
 * a well-formed code the BE no longer has shows the screen's own "not found".
 * - LIFE_CHANGE_TASK `LC-01-1` opens its life change `LC-01` (the BE
 *   guide.life_change_code is the first two parts). That screen works whether
 *   or not the member has started the change; the checklist detail only
 *   finds items already on the member's list.
 */
export function relatedPagePath({ type, code }: RelatedPage) {
  switch (type) {
    case 'EVENT':
      return isEventId(code) ? `/events/${code}` : undefined
    case 'RULE':
      return isRuleCode(code) ? `/rules/${code}` : undefined
    case 'CHECKLIST':
      return /^CL-\d{2}$/.test(code) ? `/home/checklist/${code}` : undefined
    case 'LIFE_CHANGE_TASK': {
      const lifeChange = /^(LC-\d{2})-[1-9]\d*$/.exec(code)?.[1]
      return isLifeChangeCode(lifeChange)
        ? `/home/life-changes/${lifeChange}`
        : undefined
    }
    default:
      return undefined
  }
}
