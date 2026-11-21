import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorKey, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/field'
import { Notice, Section, Stack } from '@/shared/ui/page'
import { confirmMyEmailCode, meQueryKey, sendMyEmailCode } from '../api'
import { codeSchema } from '../password-rules'
import { useCountdown } from '../use-countdown'

/**
 * NTF-09: members who signed up before email verification existed verify the
 * sign-up email here. Password reset and notification emails need it.
 */
export function EmailVerificationForm() {
  const { t } = useTranslation()
  const msg = useMessage()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [resendAt, setResendAt] = useState<number>()
  const resendSeconds = useCountdown(resendAt)

  const send = useMutation({
    mutationFn: sendMyEmailCode,
    onSuccess: (result) => {
      setSent(true)
      setCode('')
      setError(undefined)
      setResendAt(Date.now() + result.resendAvailableInSeconds * 1000)
    },
    onError: (failure) => setError(errorKey(failure)),
  })
  const confirm = useMutation({
    mutationFn: confirmMyEmailCode,
    // The member now has emailVerified: true, so this section disappears.
    onSuccess: (member) => queryClient.setQueryData(meQueryKey, member),
    onError: (failure) => setError(errorKey(failure)),
  })

  const onConfirm = () => {
    const parsed = codeSchema.safeParse(code)
    if (!parsed.success) return setError('validation.codeFormat')
    confirm.mutate(parsed.data)
  }

  return (
    <Section title={t('emailVerification.title')}>
      <Stack gap={12}>
        <Notice>{t('emailVerification.description')}</Notice>
        <Button
          variant="secondary"
          loading={send.isPending}
          disabled={resendSeconds > 0}
          onClick={() => send.mutate()}
        >
          {resendSeconds > 0
            ? `${t('emailVerification.resend')} ${t('signup.resendIn', { seconds: resendSeconds })}`
            : t(sent ? 'emailVerification.resend' : 'emailVerification.send')}
        </Button>
        <TextField
          name="emailVerificationCode"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          label={t('emailVerification.code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder={t('signup.codePlaceholder')}
          disabled={!sent}
          error={msg(error)}
          help={sent ? `○ ${t('emailVerification.sent')}` : undefined}
          helpTone="success"
          action={
            <Button
              variant="secondary"
              loading={confirm.isPending}
              disabled={!sent}
              onClick={onConfirm}
            >
              {t('emailVerification.confirm')}
            </Button>
          }
        />
      </Stack>
    </Section>
  )
}
