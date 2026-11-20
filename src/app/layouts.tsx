import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { MemberLanguageSync } from '@/features/auth/route-guards'
import { useChangeLanguage, useMe } from '@/features/auth/use-session'
import { OnboardingProvider } from '@/features/onboarding/onboarding-provider'
import { currentLanguage } from '@/shared/i18n'
import { BottomNav } from '@/shared/ui/bottom-nav'
import { LanguageSelect } from '@/shared/ui/language-select'
import { MobileFrame } from '@/shared/ui/mobile-frame'
import { TopBar } from '@/shared/ui/top-bar'

export function RootLayout() {
  return (
    <MobileFrame>
      <MemberLanguageSync />
      <ScrollRestoration />
      <Outlet />
    </MobileFrame>
  )
}

/** Screens with the M/TopBar. Notifications stay hidden in this scope. */
export function TopBarLayout() {
  const { t } = useTranslation()
  const changeLanguage = useChangeLanguage()
  return (
    <>
      <TopBar brand={t('common.brand')}>
        <LanguageSelect
          label={t('common.language')}
          value={currentLanguage()}
          onChange={changeLanguage}
        />
      </TopBar>
      <Outlet />
    </>
  )
}

/**
 * Member screens after onboarding: top bar + bottom tabs.
 * 홈 exist; other tabs render disabled until their screens are built.
 */
export function MainLayout() {
  const { t } = useTranslation()
  return (
    <>
      <TopBarLayout />
      <BottomNav
        label={t('nav.label')}
        disabledHint={t('home.comingSoon')}
        items={[
          { label: t('nav.home'), to: '/home' },
          { label: t('nav.calendar') },
          { label: t('nav.rules') },
          { label: t('nav.chat') },
          { label: t('nav.me') },
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
