import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { requestPasswordReset } from '@/features/auth/api'
import { emailSchema } from '@/features/auth/password-rules'
import { errorMessage, translateMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { InlineLink, Notice, PageHeading, Stack } from '@/shared/ui/page'
import { TextField } from '@/shared/ui/text-field'
import styles from '../pages.module.css'

const resetRequestSchema = z.object({ email: emailSchema })
type ResetRequestValues = z.input<typeof resetRequestSchema>

/**
 * M02c. The server always answers 202 so it never reveals whether the email
 * is registered; the screen shows the same notice either way.
 */
export function PasswordResetRequestPage() {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetRequestValues>({
    resolver: zodResolver(resetRequestSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })
  const submit = useMutation({ mutationFn: requestPasswordReset })
  const onSubmit = handleSubmit((values) =>
    submit.mutate({ email: values.email.trim() }),
  )

  return (
    <PageBody>
      <PageHeading title={t('resetRequest.title')} />
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Stack gap={20}>
          <TextField
            {...register('email')}
            label={t('resetRequest.email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('resetRequest.emailPlaceholder')}
            error={
              translateMessage(t, errors.email?.message) ??
              (submit.isError ? errorMessage(t, submit.error) : undefined)
            }
            help={t('resetRequest.hint')}
          />
          <Button type="submit" loading={submit.isPending}>
            {t('resetRequest.submit')}
          </Button>
          {submit.isSuccess && (
            <Notice tone="success" title={`✓ ${t('resetRequest.sentTitle')}`}>
              {t('resetRequest.sentBody')}
            </Notice>
          )}
        </Stack>
      </form>
      <div className={styles.links}>
        <InlineLink text={t('resetRequest.remembered')}>
          <Link to="/login">{t('resetRequest.login')}</Link>
        </InlineLink>
      </div>
    </PageBody>
  )
}
