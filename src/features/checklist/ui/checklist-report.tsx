import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { captureSessionScope } from '@/features/auth/session-scope'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage, useMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { SelectField, TextAreaField } from '@/shared/ui/field'
import { FormError, Notice, Stack } from '@/shared/ui/page'
import type { ChecklistItemResponse } from '../api'
import {
  checklistReportReasons,
  checklistReportSchema,
  submitChecklistReport,
  type ChecklistReportInput,
} from '../checklist-report'

export function ChecklistReport({
  item,
  memberId,
}: {
  item: ChecklistItemResponse
  memberId: number
}) {
  const { t } = useTranslation()
  const message = useMessage()
  const queryClient = useQueryClient()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const inFlight = useRef(false)
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(checklistReportSchema),
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
      values: ChecklistReportInput
      isSessionCurrent: () => boolean
    }) =>
      submitChecklistReport(
        {
          ...values,
          guideId: item.guideId,
          guideCode: item.code,
          targetTitleSnapshot: item.title,
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

  return (
    <Stack gap={12}>
      {submit.isSuccess ? (
        <Notice tone="success" title={t('checklist.report.received')} />
      ) : (
        <Button
          variant="secondary"
          block
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          disabled={submit.isPending}
          onClick={() => {
            if (open) {
              reset()
              submit.reset()
            }
            setOpen(!open)
          }}
        >
          {t(open ? 'common.cancel' : 'checklist.report.open')}
        </Button>
      )}
      {open && !submit.isSuccess && (
        <form
          id={panelId}
          onSubmit={(event) => void onSubmit(event)}
          noValidate
        >
          <Stack gap={12}>
            <TextAreaField
              {...register('quotedText')}
              label={t('checklist.report.quote')}
              error={message(formState.errors.quotedText?.message)}
              required
              readOnly={submit.isPending}
            />
            <SelectField
              {...register('reason')}
              label={t('checklist.report.reason')}
              error={message(formState.errors.reason?.message)}
              options={[
                { value: '', label: t('checklist.report.chooseReason') },
                ...checklistReportReasons.map((value) => ({
                  value,
                  label: t(`checklist.report.reasons.${value}`),
                })),
              ]}
              required
              disabled={submit.isPending}
            />
            {submit.isError && (
              <FormError message={errorMessage(t, submit.error)} />
            )}
            <Button type="submit" loading={submit.isPending}>
              {t('checklist.report.submit')}
            </Button>
          </Stack>
        </form>
      )}
    </Stack>
  )
}
