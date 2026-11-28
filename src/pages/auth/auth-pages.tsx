import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { authLinkState, returnState } from '@/features/auth/return-path'
import { LoginForm } from '@/features/auth/ui/login-form'
import { NewPasswordForm } from '@/features/auth/ui/new-password-form'
import { ResetRequestForm } from '@/features/auth/ui/reset-request-form'
import { SignupForm } from '@/features/auth/ui/signup-form'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { PageBody } from '@/shared/ui/mobile-frame'
import { InlineLink, Stack } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import styles from './auth-pages.module.css'

/** Auth screens a ‹ back may return to (set by the links between them). */
const authPaths = ['/', '/signup', '/login', '/password-reset/request']

/**
 * ‹ goes back to the auth screen whose link opened this one (login →
 * "회원가입" → ‹ returns to login), else to `fallback`. Not history.back():
 * a redirect to /login (expired session) would step back into a member page.
 */
function useBackPath(fallback: string) {
  const state = useLocation().state as { back?: unknown } | null
  return typeof state?.back === 'string' && authPaths.includes(state.back)
    ? state.back
    : fallback
}

/**
 * Figma v2 M02a–d: ‹ back + title header, an optional mascot tip, the form,
 * then centered prompts with inline links.
 */
function AuthScreen({
  title,
  back,
  tip,
  links = [],
  children,
}: {
  title: string
  back: string
  tip?: ReactNode
  links?: { text: string; label: string; to: string }[]
  children: ReactNode
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const backPath = useBackPath(back)
  return (
    <>
      <ScreenHeader
        back={{
          label: t('common.back'),
          // #68: keep the screen to return to after login on the way back.
          onClick: () => void navigate(backPath, { state: returnState(state) }),
        }}
        title={title}
      />
      <PageBody className={styles.body}>
        <Stack gap={24}>
          {tip}
          {children}
          {links.length > 0 && (
            <div className={styles.links}>
              {links.map((link) => (
                <InlineLink key={link.to} text={link.text}>
                  <Link to={link.to} state={authLinkState(pathname, state)}>
                    {link.label}
                  </Link>
                </InlineLink>
              ))}
            </div>
          )}
        </Stack>
      </PageBody>
    </>
  )
}

/** M02b */
export function SignupPage() {
  const { t } = useTranslation()
  return (
    <AuthScreen
      title={t('signup.title')}
      back="/"
      tip={<MascotTip mascot="haero">{t('authTips.signup')}</MascotTip>}
    >
      <SignupForm />
    </AuthScreen>
  )
}

/** M02a */
export function LoginPage() {
  const { t } = useTranslation()
  const state = useLocation().state as { passwordChanged?: boolean } | null
  return (
    <AuthScreen
      title={t('login.title')}
      back="/"
      tip={<MascotTip mascot="toro">{t('authTips.login')}</MascotTip>}
      links={[
        { text: t('login.newHere'), label: t('login.signup'), to: '/signup' },
        {
          text: t('login.forgot'),
          label: t('login.reset'),
          to: '/password-reset/request',
        },
      ]}
    >
      <LoginForm passwordChanged={state?.passwordChanged === true} />
    </AuthScreen>
  )
}

/** M02c */
export function PasswordResetRequestPage() {
  const { t } = useTranslation()
  return (
    <AuthScreen
      title={t('resetRequest.title')}
      back="/login"
      links={[
        {
          text: t('resetRequest.remembered'),
          label: t('resetRequest.login'),
          to: '/login',
        },
      ]}
    >
      <ResetRequestForm />
    </AuthScreen>
  )
}

/** M02d at `/password-reset?token=...` — the path is fixed by the BE reset mail. */
export function PasswordResetPage() {
  const { t } = useTranslation()
  const token = useSearchParams()[0].get('token') ?? ''
  return (
    <AuthScreen title={t('newPassword.title')} back="/login">
      {/* Remount per token so the link check starts fresh. */}
      <NewPasswordForm key={token} token={token} />
    </AuthScreen>
  )
}
