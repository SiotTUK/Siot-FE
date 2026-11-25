import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { MemberLanguageSync } from '@/features/auth/route-guards'
import { useChangeLanguage, useMe } from '@/features/auth/use-session'
import { OnboardingProvider } from '@/features/onboarding/onboarding-provider'
import { currentLanguage } from '@/shared/i18n'
import { BottomNav } from '@/shared/ui/bottom-nav'
import { LanguageSelect } from '@/shared/ui/language-select'
import { MobileFrame } from '@/shared/ui/mobile-frame'
import { BellIcon } from '@/shared/ui/icons'
import { TopBar, TopBarIconButton } from '@/shared/ui/top-bar'

export function RootLayout() {
  return (
    <MobileFrame>
      <MemberLanguageSync />
      <ScrollRestoration />
      <Outlet />
    </MobileFrame>
  )
}

/**
 * Screens with the M/TopBar. Member screens also get the notification bell,
 * disabled until the notification screen (NTF-04) is connected.
 */
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
        {member && (
          <TopBarIconButton
            label={t('nav.notifications')}
            icon={<BellIcon />}
            disabledHint={t('home.comingSoon')}
          />
        )}
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
          { label: t('nav.home'), to: '/home' },
          { label: t('nav.calendar'), to: '/calendar' },
          { label: t('nav.rules') },
          { label: t('nav.chat'), to: '/chat' },
          { label: t('nav.me'), to: '/me' },
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
