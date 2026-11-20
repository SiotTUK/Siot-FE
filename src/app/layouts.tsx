import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { MemberLanguageSync } from '@/features/auth/route-guards'
import { useChangeLanguage } from '@/features/auth/use-session'
import { currentLanguage } from '@/shared/i18n'
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
