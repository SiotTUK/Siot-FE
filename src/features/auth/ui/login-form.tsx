import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/field'
import { Notice, Stack } from '@/shared/ui/page'
import { login } from '../api'
import { loginSchema } from '../credential-schemas'
import { loginErrorMessage } from '../login-error'
import { useStartSession } from '../use-session'

// Blank and over-long values are stopped here: the server rejects them as a
// plain INVALID_INPUT, not LOGIN_FAILED. Anything else wrong is LOGIN_FAILED.
const schema = loginSchema
type Values = z.input<typeof schema>

/** M02a. Unknown email and wrong password share LOGIN_FAILED. */
export function LoginForm({ passwordChanged }: { passwordChanged: boolean }) {
  const { t } = useTranslation()
  const msg = useMessage()
  const startSession = useStartSession()
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })
  const submit = useMutation({ mutationFn: login, onSuccess: startSession })
  const onSubmit = handleSubmit((values) =>
    submit.mutate({ email: values.email.trim(), password: values.password }),
  )
  const { errors } = formState

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack>
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
          error={msg(errors.email?.message)}
        />
        <TextField
          {...register('password')}
          label={t('login.password')}
          type="password"
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
          error={
            msg(errors.password?.message) ??
            (submit.error ? loginErrorMessage(t, submit.error) : undefined)
          }
        />
        <Button type="submit" loading={submit.isPending}>
          {t('login.submit')}
        </Button>
      </Stack>
    </form>
  )
}
