import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { billKeys } from '@/features/bill-translation/api'
import { scheduleQueryKey } from '@/features/calendar/api'
import { checklistKeys } from '@/features/checklist/api'
import { eventKeys } from '@/features/events/api'
import { lifeChangeKeys } from '@/features/life-changes/api'
import { ApiError, refreshCsrf } from '@/shared/api/client'
import type { Language, MemberResponse } from '@/shared/api/types'
import {
  currentLanguage,
  markLanguageChosenBeforeLogin,
  takeLanguageChosenBeforeLogin,
} from '@/shared/i18n'
import {
  logout,
  meQueryKey,
  meQueryOptions,
  updateMyLanguage,
  withdraw,
} from './api'
import { captureSessionScope, rotateSessionScope } from './session-scope'

export function useMe() {
  return useQuery(meQueryOptions)
}

/** Where a logged-in member belongs. */
export function homePathFor(member: MemberResponse) {
  return member.onboarded ? '/home' : '/onboarding/type'
}

/** Router state passed between the guards, login and the logged-out landing. */
export interface SessionLocationState {
  /** M-08·M-10: the screen to return to after login. */
  from?: string
  /** The member just logged out or withdrew; guest screens must not bounce them home. */
  signedOut?: boolean
  /** M-06: show "탈퇴되었습니다" on the landing screen. */
  notice?: 'withdrawn'
}

export function sessionState(state: unknown): SessionLocationState {
  return state && typeof state === 'object'
    ? (state as SessionLocationState)
    : {}
}

/** Only same-app paths; never a guest screen that would bounce back. */
function returnPath(from: string | undefined) {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return undefined
  const path = from.split(/[?#]/)[0]
  if (['/', '/login', '/signup'].includes(path)) return undefined
  return from
}

/** M-08·M-10: return to the protected screen after login, after onboarding. */
export function guestRedirectPath(member: MemberResponse, from?: string) {
  return (
    (member.onboarded ? returnPath(from) : undefined) ?? homePathFor(member)
  )
}

async function refreshCsrfQuietly() {
  // The session (and its CSRF token) changes on login/logout.
  // If this fails, apiRequest refreshes on the next CSRF_TOKEN_INVALID.
  await refreshCsrf().catch(() => undefined)
}

function savedLanguageHandler(queryClient: QueryClient, memberId: number) {
  const isSessionCurrent = captureSessionScope(queryClient, memberId)
  return async (updated: MemberResponse) => {
    if (!isSessionCurrent()) return
    queryClient.setQueryData(meQueryKey, updated)

    // Event text uses the language persisted by the server.
    const queryKey = eventKeys.member(memberId)
    await queryClient.cancelQueries({ queryKey })
    if (!isSessionCurrent()) return
    queryClient.removeQueries({ queryKey, type: 'inactive' })
    await queryClient.invalidateQueries({ queryKey })
  }
}

/** Updates the session after login or signup. GuestOnly handles the redirect. */
export function useStartSession() {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()

  return useCallback(
    async (member: MemberResponse) => {
      rotateSessionScope(queryClient)
      queryClient.removeQueries({ queryKey: billKeys.all })
      queryClient.removeQueries({ queryKey: checklistKeys.all })
      queryClient.removeQueries({ queryKey: scheduleQueryKey })
      queryClient.removeQueries({ queryKey: eventKeys.all })
      queryClient.removeQueries({ queryKey: lifeChangeKeys.all })
      await refreshCsrfQuietly()
      // The language chosen on F01/top bar right before login wins; otherwise
      // use the account language so it follows the member across devices.
      const chosen = takeLanguageChosenBeforeLogin()
      if (chosen && chosen !== member.language) {
        queryClient.setQueryData(meQueryKey, { ...member, language: chosen })
        void i18n.changeLanguage(chosen)
        updateMyLanguage(chosen).then(
          savedLanguageHandler(queryClient, member.id),
          () => undefined, // Keep the screen language; it is saved again on the next change.
        )
      } else {
        queryClient.setQueryData(meQueryKey, member)
        void i18n.changeLanguage(member.language)
      }
    },
    [i18n, queryClient],
  )
}

/** Top-bar language change: instant on screen, saved to the account when logged in. */
export function useChangeLanguage() {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()

  return useCallback(
    (language: Language) => {
      const me = queryClient.getQueryData<MemberResponse | null>(meQueryKey)
      if (!me) {
        // An explicit pick (even the current language) is kept at login.
        markLanguageChosenBeforeLogin(language)
        void i18n.changeLanguage(language)
        return
      }
      if (language === currentLanguage()) return
      void i18n.changeLanguage(language)
      queryClient.setQueryData(meQueryKey, { ...me, language })
      updateMyLanguage(language).then(
        savedLanguageHandler(queryClient, me.id),
        () =>
          // Saving failed: return to the language the server still has.
          void queryClient.invalidateQueries({ queryKey: meQueryKey }),
      )
    },
    [i18n, queryClient],
  )
}

/** Forgets everything about the member on this device after the server ended the session. */
function useEndSession() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useCallback(
    async (notice?: SessionLocationState['notice']) => {
      rotateSessionScope(queryClient)
      // M-06·M-09: logged out, to the main screen. `signedOut` keeps GuestOnly
      // from sending the visitor home while `me` is still being cleared.
      const state: SessionLocationState = { signedOut: true, notice }
      navigate('/', { replace: true, state })
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== meQueryKey[0],
      })
      queryClient.setQueryData(meQueryKey, null)
      await refreshCsrfQuietly()
    },
    [navigate, queryClient],
  )
}

export function useLogout() {
  const endSession = useEndSession()

  /** Throws when the server did not end the session, so callers can show it. */
  return useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      // 401 means the session had already ended; anything else keeps the user logged in.
      if (!(error instanceof ApiError && error.status === 401)) throw error
    }
    await endSession()
  }, [endSession])
}

/** M-06·M-07. Throws (e.g. PASSWORD_INCORRECT) without touching the session. */
export function useWithdraw() {
  const endSession = useEndSession()
  return useCallback(
    async (password: string) => {
      await withdraw(password)
      await endSession('withdrawn')
    },
    [endSession],
  )
}
