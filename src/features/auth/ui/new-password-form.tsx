import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { errorKey, useMessage } from '@/shared/i18n/error-message'
import { Button, ButtonLink } from '@/shared/ui/button'
import { FormError, Muted, Notice, Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { fieldForErrorCode, refinePasswordPair } from '../password-rules'
import {
  useConfirmPasswordReset,
  usePasswordResetLink,
} from '../use-password-reset'
import { PasswordFields } from './password-fields'

const schema = z
  .object({ password: z.string(), passwordConfirm: z.string() })
  .superRefine(refinePasswordPair)
type Values = z.input<typeof schema>

const isInvalidLink = (error: unknown) =>
  error instanceof ApiError &&
  ['PASSWORD_RESET_TOKEN_INVALID', 'INVALID_INPUT'].includes(error.code)

/** M02d: checks the mail link, then sets the new password. */
export function NewPasswordForm({ token }: { token: string }) {
  const link = usePasswordResetLink(token)
  const [expired, setExpired] = useState(false)
  if (!token || expired || isInvalidLink(link.error)) return <ExpiredLink />
  return (
    <QueryState query={link}>
      <PasswordStep token={token} onExpired={() => setExpired(true)} />
    </QueryState>
  )
}

function ExpiredLink() {
  const { t } = useTranslation()
  return (
    <Stack>
      <Notice tone="note" title={t('authTips.expiredTitle')}>
        {t('authTips.expiredBody')}
      </Notice>
      <ButtonLink to="/password-reset/request">
        {t('newPassword.requestAgain')}
      </ButtonLink>
    </Stack>
  )
}

function PasswordStep({
  token,
  onExpired,
}: {
  token: string
  onExpired: () => void
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { password: '', passwordConfirm: '' },
  })
  const submit = useConfirmPasswordReset()
  const onSubmit = form.handleSubmit((values) =>
    submit.mutate(
      { token, ...values },
      {
        // A rule violation keeps the link usable; an invalid token does not.
        onError: (error) => {
          if (
            error instanceof ApiError &&
            error.code === 'PASSWORD_RESET_TOKEN_INVALID'
          )
            return onExpired()
          const field =
            error instanceof ApiError
              ? fieldForErrorCode(error.code)
              : undefined
          form.setError(
            field === 'password' || field === 'passwordConfirm'
              ? field
              : 'root.server',
            { message: errorKey(error) },
          )
        },
      },
    ),
  )

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack>
        <PasswordFields form={form} texts="newPassword" />
        <FormError message={msg(form.formState.errors.root?.server?.message)} />
        <Button type="submit" loading={submit.isPending}>
          {t('newPassword.submit')}
        </Button>
        <Muted>{t('newPassword.footer')}</Muted>
      </Stack>
    </form>
  )
}
