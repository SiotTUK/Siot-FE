import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { login } from '@/features/auth/api'
import { loginErrorMessage } from '@/features/auth/login-error'
import { useStartSession } from '@/features/auth/use-session'
import { translateMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { InlineLink, Notice, PageHeading, Stack } from '@/shared/ui/page'
import { TextField } from '@/shared/ui/text-field'
import styles from '../pages.module.css'

// Login only checks presence; the server answers LOGIN_FAILED for anything wrong.
const loginSchema = z.object({
  email: z.string().trim().min(1, 'validation.emailRequired'),
  password: z.string().min(1, 'validation.passwordRequired'),
})
type LoginValues = z.input<typeof loginSchema>

/** M02a. Unknown email and wrong password share LOGIN_FAILED. */
export function LoginPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const passwordChanged =
    (location.state as { passwordChanged?: boolean } | null)
      ?.passwordChanged === true
  const startSession = useStartSession()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })
  const submit = useMutation({ mutationFn: login, onSuccess: startSession })

  const onSubmit = handleSubmit((values) =>
    submit.mutate({ email: values.email.trim(), password: values.password }),
  )
  const serverError = submit.error
    ? loginErrorMessage(t, submit.error)
    : undefined

  return (
    <PageBody>
      <PageHeading title={t('login.title')} />
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Stack gap={20}>
          {passwordChanged && (
            <Notice tone="success">{t('login.passwordChanged')}</Notice>
          )}
          <TextField
            {...register('email')}
            label={t('login.email')}
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder={t('login.emailPlaceholder')}
            error={translateMessage(t, errors.email?.message)}
          />
          <TextField
            {...register('password')}
            label={t('login.password')}
            type="password"
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
            error={translateMessage(t, errors.password?.message) ?? serverError}
          />
          <Button type="submit" loading={submit.isPending}>
            {t('login.submit')}
          </Button>
        </Stack>
      </form>
      <div className={styles.links}>
        <InlineLink text={t('login.newHere')}>
          <Link to="/signup">{t('login.signup')}</Link>
        </InlineLink>
        <InlineLink text={t('login.forgot')}>
          <Link to="/password-reset/request">{t('login.reset')}</Link>
        </InlineLink>
      </div>
    </PageBody>
  )
}
