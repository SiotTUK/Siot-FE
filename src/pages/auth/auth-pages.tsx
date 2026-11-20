import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { LoginForm } from '@/features/auth/ui/login-form'
import { NewPasswordForm } from '@/features/auth/ui/new-password-form'
import { ResetRequestForm } from '@/features/auth/ui/reset-request-form'
import { SignupForm } from '@/features/auth/ui/signup-form'
import { PageBody } from '@/shared/ui/mobile-frame'
import { InlineLink, PageHeading, Stack } from '@/shared/ui/page'

/** Title + form + "처음이신가요? 회원가입" style links. */
function AuthScreen({
  title,
  links = [],
  children,
}: {
  title: string
  links?: { text: string; label: string; to: string }[]
  children: ReactNode
}) {
  return (
    <PageBody>
      <PageHeading title={title} />
      <Stack gap={24}>
        {children}
        {links.map((link) => (
          <InlineLink key={link.to} text={link.text}>
            <Link to={link.to}>{link.label}</Link>
          </InlineLink>
        ))}
      </Stack>
    </PageBody>
  )
}

/** M02b */
export function SignupPage() {
  const { t } = useTranslation()
  return (
    <AuthScreen
      title={t('signup.title')}
      links={[
        {
          text: t('signup.haveAccount'),
          label: t('signup.login'),
          to: '/login',
        },
      ]}
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
    <AuthScreen title={t('newPassword.title')}>
      {/* Remount per token so the link check starts fresh. */}
      <NewPasswordForm key={token} token={token} />
    </AuthScreen>
  )
}
