import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/field'
import { Notice, Stack } from '@/shared/ui/page'
import { requestPasswordReset } from '../api'
import { emailSchema } from '../password-rules'

const schema = z.object({ email: emailSchema })
type Values = z.input<typeof schema>

/**
 * M02c. The server always answers 202 so it never reveals whether the email
 * is registered; the screen shows the same notice either way.
 */
export function ResetRequestForm() {
  const { t } = useTranslation()
  const msg = useMessage()
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })
  const submit = useMutation({ mutationFn: requestPasswordReset })
  const onSubmit = handleSubmit((values) =>
    submit.mutate({ email: values.email.trim() }),
  )

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack>
        <TextField
          {...register('email')}
          label={t('resetRequest.email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('resetRequest.emailPlaceholder')}
          error={
            msg(formState.errors.email?.message) ??
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
  )
}
