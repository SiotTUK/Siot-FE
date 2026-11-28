import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Outlet,
  ScrollRestoration,
  useLocation,
  useMatches,
} from 'react-router-dom'
import { MemberLanguageSync } from '@/features/auth/route-guards'
import { useChangeLanguage, useMe } from '@/features/auth/use-session'
import { NotificationBell } from '@/features/notifications/ui/notification-bell'
import { OnboardingProvider } from '@/features/onboarding/onboarding-provider'
import { currentLanguage } from '@/shared/i18n'
import { formatDocumentTitle, routeTitleKey } from '@/shared/lib/document-title'
import { BottomNav } from '@/shared/ui/bottom-nav'
import {
  BookOpenIcon,
  CalendarIcon,
  ChatIcon,
  HomeIcon,
  UserIcon,
} from '@/shared/ui/icons'
import { LanguageSelect } from '@/shared/ui/language-select'
import { MobileFrame } from '@/shared/ui/mobile-frame'
import { TopBar } from '@/shared/ui/top-bar'
import authTheme from './auth-theme.module.css'

export function RootLayout() {
  return (
    <MobileFrame>
      <MemberLanguageSync />
      <RouteTitleSync />
      <ScrollRestoration />
      <Outlet />
    </MobileFrame>
  )
}

/**
 * Keeps `document.title` synced with the active route and current language
 * (WCAG 2.4.2, #125), and announces route transitions politely for screen
 * readers. Runs in `useLayoutEffect` so detail screens' `useDocumentTitle`
 * (`useEffect`) can safely refine the title with the loaded item name.
 */
function RouteTitleSync() {
  const { t, i18n } = useTranslation()
  const matches = useMatches()
  const { pathname } = useLocation()
  const titleKey = routeTitleKey(matches)
  const brand = t('common.brand')
  const screenTitle = titleKey ? t(titleKey) : undefined
  const [announcement, setAnnouncement] = useState('')
  const previousPath = useRef(pathname)

  useLayoutEffect(() => {
    document.title = formatDocumentTitle(brand, screenTitle)
    if (previousPath.current !== pathname) {
      previousPath.current = pathname
      setAnnouncement(screenTitle ?? brand)
    }
  }, [brand, screenTitle, pathname, i18n.language])

  return (
    <div className="visually-hidden" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  )
}

/** Start/signup screens (F01, M02a–d) on the full-height v2 canvas. */
export function AuthLayout() {
  return (
    <div className={authTheme.theme}>
      <Outlet />
    </div>
  )
}

/** Screens with the M/TopBar. Member screens also get the notification bell. */
export function TopBarLayout({ member = false }: { member?: boolean }) {
  const { t } = useTranslation()
  const changeLanguage = useChangeLanguage()
  return (
    <>
      <TopBar brand={t('common.brand')}>
        <LanguageSelect
          variant="inline"
          label={t('common.language')}
          value={currentLanguage()}
          onChange={changeLanguage}
        />
        {member && <NotificationBell />}
      </TopBar>
      <Outlet />
    </>
  )
}

/**
 * Member screens after onboarding: top bar + bottom tabs.
 * Tabs without a screen remain disabled.
 */
export function MainLayout() {
  const { t } = useTranslation()
  return (
    <>
      <TopBarLayout member />
      <BottomNav
        label={t('nav.label')}
        disabledHint={t('home.comingSoon')}
        items={[
          { label: t('nav.home'), to: '/home', icon: HomeIcon },
          { label: t('nav.calendar'), to: '/calendar', icon: CalendarIcon },
          { label: t('nav.rules'), to: '/rules', icon: BookOpenIcon },
          { label: t('nav.chat'), to: '/chat', icon: ChatIcon },
          { label: t('nav.me'), to: '/me', icon: UserIcon },
        ]}
      />
    </>
  )
}

/** Rendered under RequireMember, so `me` is present. */
export function OnboardingLayout() {
  const { data: me } = useMe()
  if (!me) return null
  return <OnboardingProvider key={me.id} memberId={me.id} />
}
