import { chatBackPath } from '@/shared/lib/chat-back'

export function isEventId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value)
}

export function eventDetailBackPath(from: unknown) {
  if (typeof from !== 'string') return '/events'
  if (
    from === '/home' ||
    from === '/notifications' ||
    /^\/(?:events|calendar)(?:\?[^#]*)?$/.test(from)
  )
    return from

  return chatBackPath({ from }) ?? '/events'
}
