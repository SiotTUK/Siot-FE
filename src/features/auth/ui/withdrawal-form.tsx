import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { errorKey, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { ConfirmPanel } from '@/shared/ui/confirm-panel'
import { TextField } from '@/shared/ui/field'
import { FormError, Notice, Section, Stack } from '@/shared/ui/page'
import { useWithdraw } from '../use-session'

const schema = z.object({
  password: z.string().min(1, 'validation.passwordRequired'),
})
type Values = z.input<typeof schema>

/** M-06·M-07: warning → password → in-page confirmation → delete at once. */
export function WithdrawalForm() {
  const { t } = useTranslation()
  const msg = useMessage()
  const [confirming, setConfirming] = useState(false)
  const { register, handleSubmit, setError, getValues, formState } =
    useForm<Values>({
      resolver: zodResolver(schema),
      defaultValues: { password: '' },
    })
  const withdraw = useMutation({
    mutationFn: useWithdraw(),
    onError: (error) => {
      setConfirming(false)
      // A wrong password is 400, never treated as an expired session.
      if (error instanceof ApiError && error.code === 'PASSWORD_INCORRECT')
        setError('password', { message: errorKey(error) })
      else setError('root.server', { message: errorKey(error) })
    },
  })

  return (
    <Section title={t('withdrawal.title')}>
      <Notice tone="danger" title={t('withdrawal.warning')}>
        <ul>
          <li>{t('withdrawal.item1')}</li>
          <li>{t('withdrawal.item2')}</li>
          <li>{t('withdrawal.item3')}</li>
        </ul>
      </Notice>
      <form
        noValidate
        onSubmit={(event) =>
          void handleSubmit(() => setConfirming(true))(event)
        }
      >
        <Stack gap={12}>
          <TextField
            {...register('password')}
            label={t('withdrawal.password')}
            type="password"
            autoComplete="current-password"
            placeholder={t('withdrawal.passwordPlaceholder')}
            error={msg(formState.errors.password?.message)}
          />
          <FormError message={msg(formState.errors.root?.server?.message)} />
          {confirming ? (
            <ConfirmPanel
              danger
              message={t('withdrawal.confirm')}
              confirmLabel={t('withdrawal.confirmAction')}
              cancelLabel={t('common.cancel')}
              pending={withdraw.isPending}
              onCancel={() => setConfirming(false)}
              onConfirm={() => withdraw.mutate(getValues('password'))}
            />
          ) : (
            <Button type="submit" variant="danger">
              {t('withdrawal.submit')}
            </Button>
          )}
        </Stack>
      </form>
    </Section>
  )
}
