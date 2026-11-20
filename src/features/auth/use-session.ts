import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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

export function useMe() {
  return useQuery(meQueryOptions)
}

/** Where a logged-in member belongs. */
export function homePathFor(member: MemberResponse) {
  return member.onboarded ? '/home' : '/onboarding/type'
}

async function refreshCsrfQuietly() {
  // The session (and its CSRF token) changes on login/logout.
  // If this fails, apiRequest refreshes on the next CSRF_TOKEN_INVALID.
  await refreshCsrf().catch(() => undefined)
}

/** Called after login or signup succeeds (session cookie is set). */
export function useStartSession() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  return useCallback(
    async (member: MemberResponse) => {
      await refreshCsrfQuietly()
      // The language chosen on F01/top bar right before login wins; otherwise
      // use the account language so it follows the member across devices.
      const chosen = takeLanguageChosenBeforeLogin()
      if (chosen && chosen !== member.language) {
        queryClient.setQueryData(meQueryKey, { ...member, language: chosen })
        void i18n.changeLanguage(chosen)
        updateMyLanguage(chosen).then(
          (updated) => queryClient.setQueryData(meQueryKey, updated),
          () => undefined, // Keep the screen language; it is saved again on the next change.
        )
      } else {
        queryClient.setQueryData(meQueryKey, member)
        void i18n.changeLanguage(member.language)
      }
      navigate(homePathFor(member), { replace: true })
    },
    [i18n, navigate, queryClient],
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
        (updated) => queryClient.setQueryData(meQueryKey, updated),
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
    async (to: string) => {
      await refreshCsrfQuietly()
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== meQueryKey[0],
      })
      queryClient.setQueryData(meQueryKey, null)
      navigate(to, { replace: true })
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
    await endSession('/login')
  }, [endSession])
}

/** M-06·M-07. Throws (e.g. PASSWORD_INCORRECT) without touching the session. */
export function useWithdraw() {
  const endSession = useEndSession()
  return useCallback(
    async (password: string) => {
      await withdraw(password)
      // Same landing as logout: the member guard sends a session-less visitor
      // to login as soon as `me` is cleared, so a different target would race it.
      await endSession('/login')
    },
    [endSession],
  )
}
