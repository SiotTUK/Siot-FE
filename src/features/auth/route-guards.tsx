import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { MemberResponse } from '@/shared/api/types'
import { hasStoredLanguage } from '@/shared/i18n'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { QueryState } from '@/shared/ui/query-state'
import {
  homePathFor,
  sessionState,
  type SessionLocationState,
  useMe,
} from './use-session'

/**
 * `/`, `/signup`, `/login`: logged-in members go to onboarding or home.
 * If the session check itself fails, still show the page so people can log in.
 */
export function GuestOnly() {
  const { t } = useTranslation()
  const { data: me, isPending } = useMe()
  const { signedOut } = sessionState(useLocation().state)
  if (isPending) return <PageLoader label={t('common.loading')} />
  if (me && !signedOut) return <Navigate to={homePathFor(me)} replace />
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
  if (me === undefined)
    return (
      <PageBody>
        <QueryState query={query}>{null}</QueryState>
      </PageBody>
    )
  if (!me) {
    // M-10: after login, come back here.
    const state: SessionLocationState = {
      from: location.pathname + location.search,
    }
    return (
      <Navigate
        to={hasStoredLanguage() ? '/login' : '/'}
        replace
        state={state}
      />
    )
  }
  if (!allowed[when](me)) return <Navigate to={homePathFor(me)} replace />
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
