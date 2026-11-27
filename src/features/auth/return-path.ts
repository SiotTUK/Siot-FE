/**
 * M-08·M-10 (#68): the protected screen a visitor opened before logging in.
 * The guard puts it in router state as `from`; the language page and the
 * auth screens pass it on, and signup or onboarding keeps it until F06.
 */

/** Only same-app paths; never a guest screen that would bounce back. */
export function returnPath(from: unknown) {
  if (typeof from !== 'string') return undefined
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('\\'))
    return undefined
  const path = from.split(/[?#]/)[0]
  if (['/', '/login', '/signup'].includes(path)) return undefined
  if (path.startsWith('/password-reset') || path.startsWith('/onboarding'))
    return undefined
  return from
}

/** Router state that carries the return path to the next auth screen. */
export function returnState(state: unknown): { from: string } | undefined {
  const from = returnPath((state as { from?: unknown } | null)?.from)
  return from ? { from } : undefined
}

/** State for a link between auth screens: ‹ comes back here, `from` rides along. */
export function authLinkState(pathname: string, state: unknown) {
  return { back: pathname, ...returnState(state) }
}

const storageKey = 'siot:return-after-onboarding'

/**
 * Signup and members who have not onboarded go through F02~F06 first. Keep
 * the return path for that member until onboarding ends; any other path
 * (or none) clears an older one.
 */
export function rememberReturnPath(memberId: number, from: unknown) {
  const path = returnPath(from)
  try {
    if (path)
      sessionStorage.setItem(storageKey, JSON.stringify({ memberId, path }))
    else sessionStorage.removeItem(storageKey)
  } catch {
    // Storage blocked: onboarding ends on the home screen as before.
  }
}

/**
 * The kept path for this member. Only reads, so a guard can call it while
 * rendering; `clearReturnPath` removes it once the member has moved on.
 */
export function peekReturnPath(memberId: number) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as {
      memberId?: unknown
      path?: unknown
    } | null
    return saved?.memberId === memberId ? returnPath(saved.path) : undefined
  } catch {
    return undefined
  }
}

export function clearReturnPath() {
  try {
    sessionStorage.removeItem(storageKey)
  } catch {
    // Storage blocked: nothing was kept.
  }
}
