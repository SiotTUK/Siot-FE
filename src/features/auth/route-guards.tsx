import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { hasStoredLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { FormError, Stack } from '@/shared/ui/page'
import { homePathFor, useMe } from './use-session'

/**
 * `/`, `/signup`, `/login`: logged-in members go to onboarding or home.
 * If the session check itself fails, still show the page so people can log in.
 */
export function GuestOnly() {
  const { t } = useTranslation()
  const { data: me, isPending } = useMe()
  if (isPending) return <PageLoader label={t('common.loading')} />
  if (me) return <Navigate to={homePathFor(me)} replace />
  return <Outlet />
}

/**
 * Members only. `onboarded` picks which side of onboarding the route is on.
 * Screen guards are UX only; the server still rejects unauthenticated calls.
 */
export function RequireMember({ onboarded }: { onboarded: boolean }) {
  const { t } = useTranslation()
  const { data: me, isPending, isError, error, refetch, isFetching } = useMe()

  if (isPending) return <PageLoader label={t('common.loading')} />
  if (isError && me === undefined)
    return (
      <PageBody>
        <Stack gap={16}>
          <FormError message={errorMessage(t, error)} />
          <Button loading={isFetching} onClick={() => void refetch()}>
            {t('common.retry')}
          </Button>
        </Stack>
      </PageBody>
    )
  if (!me) return <Navigate to={hasStoredLanguage() ? '/login' : '/'} replace />
  if (me.onboarded !== onboarded)
    return <Navigate to={homePathFor(me)} replace />
  return <Outlet />
}

/** Keeps the screen language equal to the account language after login. */
export function MemberLanguageSync() {
  const { i18n } = useTranslation()
  const { data: me } = useMe()
  const language = me?.language
  useEffect(() => {
    if (language && language !== i18n.resolvedLanguage)
      void i18n.changeLanguage(language)
  }, [i18n, language])
  return null
}

/**
 * Admin screens (ADM-01·08, CHK-06). UX only: the server still answers 403
 * FORBIDDEN to non-admins. Admins are not forced through onboarding here.
 */
export function RequireAdmin() {
  const { t } = useTranslation()
  const { data: me, isPending } = useMe()
  if (isPending) return <PageLoader label={t('common.loading')} />
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== 'ADMIN') return <Navigate to={homePathFor(me)} replace />
  return <Outlet />
}
