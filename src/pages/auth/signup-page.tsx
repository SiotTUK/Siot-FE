import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { confirmSignupCode, sendSignupCode, signup } from '@/features/auth/api'
import {
  codeSchema,
  emailSchema,
  fieldForErrorCode,
  refinePasswordPair,
} from '@/features/auth/password-rules'
import { PasswordRuleList } from '@/features/auth/ui/password-rule-list'
import { useCountdown } from '@/features/auth/use-countdown'
import { useStartSession } from '@/features/auth/use-session'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { errorKey, translateMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import {
  FormError,
  InlineLink,
  Notice,
  PageHeading,
  Stack,
} from '@/shared/ui/page'
import { TextField } from '@/shared/ui/text-field'
import styles from '../pages.module.css'

const signupSchema = z
  .object({
    email: emailSchema,
    code: z.string(),
    password: z.string(),
    passwordConfirm: z.string(),
  })
  .superRefine(refinePasswordPair)

type SignupValues = z.input<typeof signupSchema>

/**
 * M02b: email → 6-digit code → password → signup (logged in, onboarded=false).
 * `verifiedEmail` is the address the server confirmed; the email field locks then.
 */
export function SignupPage() {
  const { t } = useTranslation()
  const startSession = useStartSession()
  const [sentEmail, setSentEmail] = useState<string>()
  const [verifiedEmail, setVerifiedEmail] = useState<string>()
  const [resendAt, setResendAt] = useState<number>()
  const resendSeconds = useCountdown(resendAt)

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: { email: '', code: '', password: '', passwordConfirm: '' },
  })

  const [password, email] = useWatch({ control, name: ['password', 'email'] })

  const send = useMutation({ mutationFn: sendSignupCode })
  const confirm = useMutation({ mutationFn: confirmSignupCode })
  const submit = useMutation({ mutationFn: signup, onSuccess: startSession })

  const onSendCode = async () => {
    if (!(await trigger('email'))) return
    const email = getValues('email').trim()
    send.mutate(
      { email, language: currentLanguage() },
      {
        onSuccess: (result) => {
          setSentEmail(email)
          setVerifiedEmail(undefined)
          setResendAt(Date.now() + result.resendAvailableInSeconds * 1000)
          setValue('code', '')
          clearErrors(['email', 'code'])
        },
        onError: (error) => setError('email', { message: errorKey(error) }),
      },
    )
  }

  const onConfirmCode = () => {
    if (!sentEmail) return
    const code = codeSchema.safeParse(getValues('code'))
    if (!code.success) {
      setError('code', { message: 'validation.codeFormat' })
      return
    }
    confirm.mutate(
      { email: sentEmail, code: code.data },
      {
        onSuccess: () => {
          setVerifiedEmail(sentEmail)
          clearErrors('code')
        },
        onError: (error) => setError('code', { message: errorKey(error) }),
      },
    )
  }

  const onSubmit = handleSubmit((values) => {
    if (!verifiedEmail) {
      setError('code', { message: 'errors.EMAIL_NOT_VERIFIED' })
      return
    }
    submit.mutate(
      {
        email: verifiedEmail,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
        language: currentLanguage(),
      },
      {
        onError: (error) => {
          const field =
            error instanceof ApiError
              ? fieldForErrorCode(error.code)
              : undefined
          // The 30-minute verification window passed: verify again.
          if (field === 'code') setVerifiedEmail(undefined)
          setError(field ?? 'root.server', { message: errorKey(error) })
        },
      },
    )
  })

  const emailField = register('email', {
    // Editing the address after sending invalidates the sent code.
    onChange: () => {
      if (sentEmail) setSentEmail(undefined)
    },
  })
  const verified = Boolean(verifiedEmail)
  const msg = (message?: string) => translateMessage(t, message)

  return (
    <PageBody>
      <PageHeading title={t('signup.title')} />
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Stack gap={20}>
          <TextField
            {...emailField}
            label={t('signup.email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('signup.emailPlaceholder')}
            readOnly={verified}
            error={msg(errors.email?.message)}
            help={sentEmail ? `○ ${t('signup.codeSent')}` : undefined}
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
                  : sentEmail
                    ? t('signup.resendCode')
                    : t('signup.sendCode')}
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
                : sentEmail
                  ? t('signup.codeHelp')
                  : undefined
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
          <Stack gap={8}>
            <TextField
              {...register('password')}
              label={t('signup.password')}
              type="password"
              autoComplete="new-password"
              placeholder={t('signup.passwordPlaceholder')}
              error={msg(errors.password?.message)}
            />
            <PasswordRuleList
              password={password}
              email={verifiedEmail ?? email}
            />
          </Stack>
          <TextField
            {...register('passwordConfirm')}
            label={t('signup.passwordConfirm')}
            type="password"
            autoComplete="new-password"
            placeholder={t('signup.passwordConfirmPlaceholder')}
            error={msg(errors.passwordConfirm?.message)}
          />
          <Notice tone="info">{t('signup.notice')}</Notice>
          <FormError message={msg(errors.root?.server?.message)} />
          <Button type="submit" loading={submit.isPending}>
            {t('signup.submit')}
          </Button>
        </Stack>
      </form>
      <div className={styles.links}>
        <InlineLink text={t('signup.haveAccount')}>
          <Link to="/login">{t('signup.login')}</Link>
        </InlineLink>
      </div>
    </PageBody>
  )
}
