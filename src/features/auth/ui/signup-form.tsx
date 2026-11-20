import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { errorKey, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/field'
import { FormError, Notice, Stack } from '@/shared/ui/page'
import { confirmSignupCode, sendSignupCode, signup } from '../api'
import {
  codeSchema,
  emailSchema,
  fieldForErrorCode,
  refinePasswordPair,
} from '../password-rules'
import { useCountdown } from '../use-countdown'
import { useStartSession } from '../use-session'
import { PasswordFields } from './password-fields'

const schema = z
  .object({
    email: emailSchema,
    code: z.string(),
    password: z.string(),
    passwordConfirm: z.string(),
  })
  .superRefine(refinePasswordPair)
type Values = z.input<typeof schema>

/**
 * M02b: email → 6-digit code → password → signup (logged in, onboarded=false).
 * `verifiedEmail` is the address the server confirmed; the email field locks then.
 */
export function SignupForm() {
  const { t } = useTranslation()
  const msg = useMessage()
  const startSession = useStartSession()
  const [sentEmail, setSentEmail] = useState<string>()
  const [verifiedEmail, setVerifiedEmail] = useState<string>()
  const [resendAt, setResendAt] = useState<number>()
  const resendSeconds = useCountdown(resendAt)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', code: '', password: '', passwordConfirm: '' },
  })
  const { register, getValues, setError, clearErrors, formState } = form
  const email = useWatch({ control: form.control, name: 'email' })

  const send = useMutation({
    mutationFn: sendSignupCode,
    onSuccess: (result, { email }) => {
      setSentEmail(email)
      setVerifiedEmail(undefined)
      setResendAt(Date.now() + result.resendAvailableInSeconds * 1000)
      form.setValue('code', '')
      clearErrors(['email', 'code'])
    },
    onError: (error) => setError('email', { message: errorKey(error) }),
  })
  const confirm = useMutation({
    mutationFn: confirmSignupCode,
    onSuccess: (_, { email }) => {
      setVerifiedEmail(email)
      clearErrors('code')
    },
    onError: (error) => setError('code', { message: errorKey(error) }),
  })
  const submit = useMutation({
    mutationFn: signup,
    onSuccess: startSession,
    onError: (error) => {
      const field =
        error instanceof ApiError ? fieldForErrorCode(error.code) : undefined
      // The 30-minute verification window passed: verify again.
      if (field === 'code') setVerifiedEmail(undefined)
      setError(field ?? 'root.server', { message: errorKey(error) })
    },
  })

  const onSendCode = async () => {
    if (await form.trigger('email'))
      send.mutate({
        email: getValues('email').trim(),
        language: currentLanguage(),
      })
  }
  const onConfirmCode = () => {
    const code = codeSchema.safeParse(getValues('code'))
    if (!code.success)
      return setError('code', { message: 'validation.codeFormat' })
    if (sentEmail) confirm.mutate({ email: sentEmail, code: code.data })
  }
  const onSubmit = form.handleSubmit((values) => {
    if (!verifiedEmail)
      return setError('code', { message: 'errors.EMAIL_NOT_VERIFIED' })
    submit.mutate({
      email: verifiedEmail,
      password: values.password,
      passwordConfirm: values.passwordConfirm,
      language: currentLanguage(),
    })
  })

  const verified = Boolean(verifiedEmail)
  const { errors } = formState
  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack>
        <TextField
          // Editing the address after sending invalidates the sent code.
          {...register('email', { onChange: () => setSentEmail(undefined) })}
          label={t('signup.email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('signup.emailPlaceholder')}
          readOnly={verified}
          error={msg(errors.email?.message)}
          help={sentEmail && `○ ${t('signup.codeSent')}`}
          helpTone="success"
          action={
            <Button
              variant="secondary"
              loading={send.isPending}
              disabled={verified || resendSeconds > 0}
              onClick={() => void onSendCode()}
            >
              {resendSeconds > 0
                ? `${t('signup.resendCode')} ${t('signup.resendIn', { seconds: resendSeconds })}`
                : t(sentEmail ? 'signup.resendCode' : 'signup.sendCode')}
            </Button>
          }
        />
        <TextField
          {...register('code')}
          label={t('signup.code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder={t('signup.codePlaceholder')}
          disabled={!sentEmail && !verified}
          readOnly={verified}
          error={msg(errors.code?.message)}
          help={
            verified
              ? `✓ ${t('signup.verified')}`
              : sentEmail && t('signup.codeHelp')
          }
          helpTone={verified ? 'success' : 'default'}
          action={
            <Button
              variant="secondary"
              loading={confirm.isPending}
              disabled={!sentEmail || verified}
              onClick={onConfirmCode}
            >
              {t('signup.confirmCode')}
            </Button>
          }
        />
        <PasswordFields form={form} email={verifiedEmail ?? email} showRules />
        <Notice>{t('signup.notice')}</Notice>
        <FormError message={msg(errors.root?.server?.message)} />
        <Button type="submit" loading={submit.isPending}>
          {t('signup.submit')}
        </Button>
      </Stack>
    </form>
  )
}
