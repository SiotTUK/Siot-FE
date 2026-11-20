import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import {
  confirmPasswordReset,
  meQueryKey,
  validatePasswordResetToken,
} from '@/features/auth/api'
import {
  fieldForErrorCode,
  refinePasswordPair,
} from '@/features/auth/password-rules'
import { ApiError, refreshCsrf } from '@/shared/api/client'
import {
  errorKey,
  errorMessage,
  translateMessage,
} from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { FormError, PageHeading, Stack } from '@/shared/ui/page'
import { TextField } from '@/shared/ui/text-field'
import styles from '../pages.module.css'

const newPasswordSchema = z
  .object({ password: z.string(), passwordConfirm: z.string() })
  .superRefine(refinePasswordPair)
type NewPasswordValues = z.input<typeof newPasswordSchema>

function isInvalidLink(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'PASSWORD_RESET_TOKEN_INVALID' ||
      error.code === 'INVALID_INPUT')
  )
}

/**
 * M02d at `/password-reset?token=...` — the path is fixed by the BE reset mail.
 * The token stays in memory only and is never logged.
 */
export function PasswordResetPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  if (token === '') return <InvalidLink />
  // Remount per token so state and the validation query start fresh.
  return <ResetWithToken key={token} token={token} />
}

function ResetWithToken({ token }: { token: string }) {
  const { t } = useTranslation()
  const [linkExpired, setLinkExpired] = useState(false)

  const validation = useQuery({
    // The token is a secret: keep it out of the query key, which ends up in logs.
    queryKey: ['password-reset-validation'],
    queryFn: () => validatePasswordResetToken(token),
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnMount: 'always',
  })

  if (linkExpired || isInvalidLink(validation.error)) return <InvalidLink />
  if (validation.isPending)
    return <PageLoader label={t('newPassword.checking')} />
  if (validation.isError)
    return (
      <PageBody>
        <Stack gap={16}>
          <FormError message={errorMessage(t, validation.error)} />
          <Button
            loading={validation.isFetching}
            onClick={() => void validation.refetch()}
          >
            {t('common.retry')}
          </Button>
        </Stack>
      </PageBody>
    )
  return (
    <NewPasswordForm token={token} onExpired={() => setLinkExpired(true)} />
  )
}

function InvalidLink() {
  const { t } = useTranslation()
  return (
    <PageBody>
      <PageHeading title={t('newPassword.title')} />
      <Stack gap={20}>
        <FormError message={t('newPassword.invalid')} />
        <Link className={styles.buttonLink} to="/password-reset/request">
          {t('newPassword.requestAgain')}
        </Link>
      </Stack>
    </PageBody>
  )
}

function NewPasswordForm({
  token,
  onExpired,
}: {
  token: string
  onExpired: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', passwordConfirm: '' },
  })

  const submit = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: async () => {
      // Every session of this member is ended by the server.
      queryClient.setQueryData(meQueryKey, null)
      await refreshCsrf().catch(() => undefined)
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.code === 'PASSWORD_RESET_TOKEN_INVALID'
      )
        return onExpired()
      const field =
        error instanceof ApiError ? fieldForErrorCode(error.code) : undefined
      setError(
        field === 'password' || field === 'passwordConfirm'
          ? field
          : 'root.server',
        { message: errorKey(error) },
      )
    },
  })

  const onSubmit = handleSubmit((values) => submit.mutate({ token, ...values }))
  const msg = (message?: string) => translateMessage(t, message)

  return (
    <PageBody>
      <PageHeading title={t('newPassword.title')} />
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Stack gap={20}>
          <TextField
            {...register('password')}
            label={t('newPassword.password')}
            type="password"
            autoComplete="new-password"
            placeholder={t('newPassword.passwordPlaceholder')}
            error={msg(errors.password?.message)}
          />
          <TextField
            {...register('passwordConfirm')}
            label={t('newPassword.passwordConfirm')}
            type="password"
            autoComplete="new-password"
            placeholder={t('newPassword.passwordConfirmPlaceholder')}
            error={msg(errors.passwordConfirm?.message)}
          />
          <FormError message={msg(errors.root?.server?.message)} />
          <Button type="submit" loading={submit.isPending}>
            {t('newPassword.submit')}
          </Button>
          <p className={styles.hint}>{t('newPassword.footer')}</p>
        </Stack>
      </form>
    </PageBody>
  )
}
