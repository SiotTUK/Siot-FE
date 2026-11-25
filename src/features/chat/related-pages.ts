import { isEventId } from '@/features/events/event-routes'
import type { RelatedPage } from './api'

export function relatedPagePath({ type, code }: RelatedPage) {
  return type === 'EVENT' && isEventId(code) ? `/events/${code}` : undefined
}
