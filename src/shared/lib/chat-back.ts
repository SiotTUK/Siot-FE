/**
 * Chat related-page links (CB-10) open a screen with `state.from` set to the
 * conversation (`/chat/12`). Returns that path so "‹" goes back to the
 * conversation, or undefined for any other state.
 */
export function chatBackPath(state: unknown): string | undefined {
  const from = (state as { from?: unknown } | null)?.from
  if (typeof from !== 'string') return undefined
  const conversationId = /^\/chat\/([1-9]\d*)$/.exec(from)?.[1]
  return conversationId && Number.isSafeInteger(Number(conversationId))
    ? from
    : undefined
}
