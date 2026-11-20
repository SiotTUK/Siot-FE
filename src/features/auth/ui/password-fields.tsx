import { useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMessage } from '@/shared/i18n/error-message'
import { TextField } from '@/shared/ui/field'
import { Stack } from '@/shared/ui/page'
import { PasswordRuleList } from './password-rule-list'

type PasswordValues = { password: string; passwordConfirm: string }

/** New password + confirmation (M02b signup, M02d reset). */
export function PasswordFields<T extends PasswordValues>({
  form,
  email,
  showRules = false,
  texts = 'signup',
}: {
  form: UseFormReturn<T>
  email?: string
  showRules?: boolean
  /** Which screen's labels to use. */
  texts?: 'signup' | 'newPassword'
}) {
  const { t } = useTranslation()
  const msg = useMessage()
  // Narrow the generic form to the two fields this component owns.
  const own = form as unknown as UseFormReturn<PasswordValues>
  const password = useWatch({ control: own.control, name: 'password' })
  const errors = own.formState.errors as FieldErrors<PasswordValues>
  return (
    <>
      <Stack gap={8}>
        <TextField
          {...own.register('password')}
          label={t(`${texts}.password`)}
          type="password"
          autoComplete="new-password"
          placeholder={t(`${texts}.passwordPlaceholder`)}
          error={msg(errors.password?.message)}
        />
        {showRules && <PasswordRuleList password={password} email={email} />}
      </Stack>
      <TextField
        {...own.register('passwordConfirm')}
        label={t(`${texts}.passwordConfirm`)}
        type="password"
        autoComplete="new-password"
        placeholder={t(`${texts}.passwordConfirmPlaceholder`)}
        error={msg(errors.passwordConfirm?.message)}
      />
    </>
  )
}
