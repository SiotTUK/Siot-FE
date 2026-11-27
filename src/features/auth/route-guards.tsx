import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { MemberResponse } from '@/shared/api/types'
import { hasStoredLanguage } from '@/shared/i18n'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { QueryState } from '@/shared/ui/query-state'
import {
  guestRedirectPath,
  homePathFor,
  sessionState,
  type SessionLocationState,
  useMe,
} from './use-session'
import {
  clearReturnPath,
  peekReturnPath,
  rememberReturnPath,
} from './return-path'

/**
 * `/`, `/signup`, `/login`: logged-in members go to onboarding or home.
 * If the session check itself fails, still show the page so people can log in.
 */
export function GuestOnly() {
  const { t } = useTranslation()
  const { data: me, isPending } = useMe()
  const { from, signedOut } = sessionState(useLocation().state)
  const toOnboarding = Boolean(me && !signedOut && !me.onboarded)
  // #68: signup and members who have not onboarded return here after F06.
  useEffect(() => {
    if (me && toOnboarding) rememberReturnPath(me.id, from)
  }, [me, toOnboarding, from])
  if (isPending) return <PageLoader label={t('common.loading')} />
  if (me && !signedOut)
    return <Navigate to={guestRedirectPath(me, from)} replace />
  return <Outlet />
}

const allowed: Record<
  'onboarding' | 'onboarded' | 'admin',
  (me: MemberResponse) => boolean
> = {
  onboarding: (me) => !me.onboarded,
  onboarded: (me) => me.onboarded,
  // Admins are not forced through onboarding.
  admin: (me) => me.role === 'ADMIN',
}

/**
 * Members only, on the side of onboarding (or role) the route needs.
 * Screen guards are UX only; the server still rejects the API calls.
 */
export function RequireMember({ when }: { when: keyof typeof allowed }) {
  const query = useMe()
  const location = useLocation()
  const me = query.data
  const path = location.pathname + location.search
  const toOnboarding = Boolean(me && when === 'onboarded' && !me.onboarded)
  // F06 saved: this guard moves the member on, so the screen kept for after
  // onboarding is used once and then forgotten.
  const onboardingDone = Boolean(me && when === 'onboarding' && me.onboarded)
  // #68: a member who has not onboarded opened a screen; come back after F06.
  useEffect(() => {
    if (me && toOnboarding) rememberReturnPath(me.id, path)
    if (onboardingDone) clearReturnPath()
  }, [me, toOnboarding, onboardingDone, path])
  if (me === undefined)
    return (
      <PageBody>
        <QueryState query={query}>{null}</QueryState>
      </PageBody>
    )
  if (!me) {
    // M-10: after login, come back here.
    const state: SessionLocationState = { from: path }
    return (
      <Navigate
        to={hasStoredLanguage() ? '/login' : '/'}
        replace
        state={state}
      />
    )
  }
  if (!allowed[when](me)) {
    const target = onboardingDone ? peekReturnPath(me.id) : undefined
    return <Navigate to={target ?? homePathFor(me)} replace />
  }
  return <Outlet />
}

/** Keeps the screen language equal to the account language after login. */
export function MemberLanguageSync() {
  const { i18n } = useTranslation()
  const language = useMe().data?.language
  useEffect(() => {
    if (language && language !== i18n.resolvedLanguage)
      void i18n.changeLanguage(language)
  }, [i18n, language])
  return null
}
