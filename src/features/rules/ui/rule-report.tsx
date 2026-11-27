import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { captureSessionScope } from '@/features/auth/session-scope'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { SelectField, TextAreaField } from '@/shared/ui/field'
import { FormError, Notice, Stack } from '@/shared/ui/page'
import {
  ruleReportReasons,
  ruleReportSchema,
  submitRuleReport,
  type RuleReportInput,
} from '../rule-report'
import type { Rule } from '../rules'

/**
 * 정보 오류 신고 form for one rule (COM-01). The detail screen opens it from
 * its bottom button. Bound to the login session that started the request.
 */
export function RuleReport({
  rule,
  memberId,
  id,
}: {
  rule: Rule
  memberId: number
  id: string
}) {
  const { t } = useTranslation()
  const message = useMessage()
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(ruleReportSchema),
    defaultValues: { quotedText: '', reason: '' },
  })
  const submit = useMutation({
    networkMode: 'always',
    retry: false,
    onMutate: ({ isSessionCurrent }) => ({ isSessionCurrent }),
    mutationFn: ({
      values,
      isSessionCurrent,
    }: {
      values: RuleReportInput
      isSessionCurrent: () => boolean
    }) =>
      submitRuleReport(
        {
          ...values,
          guideCode: rule.code,
          language: currentLanguage(),
        },
        isSessionCurrent,
      ),
  })
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    try {
      await handleSubmit((values) =>
        submit.mutateAsync({
          values,
          isSessionCurrent: captureSessionScope(queryClient, memberId),
        }),
      )(event)
    } catch {
      // The mutation exposes the error while the form keeps the entered values.
    } finally {
      inFlight.current = false
    }
  }

  if (submit.isSuccess)
    return (
      <div id={id}>
        <Notice tone="success" title={t('rules.report.received')} />
      </div>
    )
  return (
    <form id={id} onSubmit={(event) => void onSubmit(event)} noValidate>
      <Stack gap={12}>
        <TextAreaField
          {...register('quotedText')}
          label={t('rules.report.quote')}
          error={message(formState.errors.quotedText?.message)}
          required
          readOnly={submit.isPending}
        />
        <SelectField
          {...register('reason')}
          label={t('rules.report.reason')}
          error={message(formState.errors.reason?.message)}
          options={[
            { value: '', label: t('rules.report.chooseReason') },
            ...ruleReportReasons.map((value) => ({
              value,
              label: t(`rules.report.reasons.${value}`),
            })),
          ]}
          required
          disabled={submit.isPending}
        />
        {submit.isError && (
          <FormError message={errorMessage(t, submit.error)} />
        )}
        <Button type="submit" loading={submit.isPending}>
          {t('rules.report.submit')}
        </Button>
      </Stack>
    </form>
  )
}
