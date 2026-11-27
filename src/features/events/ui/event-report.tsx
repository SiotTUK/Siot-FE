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
import type { EventDetail } from '../api'
import {
  eventReportReasons,
  eventReportSchema,
  submitEventReport,
  type EventReportInput,
} from '../event-report'

export function EventReport({
  event,
  memberId,
}: {
  event: EventDetail
  memberId: number
}) {
  const { t } = useTranslation()
  const message = useMessage()
  const queryClient = useQueryClient()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const inFlight = useRef(false)
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(eventReportSchema),
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
      values: EventReportInput
      isSessionCurrent: () => boolean
    }) =>
      submitEventReport(
        {
          ...values,
          eventId: event.eventId,
          targetTitleSnapshot: event.title,
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
        <Notice tone="success" title={t('events.report.received')} />
      ) : (
        <Button
          variant="text"
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
          {t(open ? 'common.cancel' : 'events.report.open')}
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
              label={t('events.report.quote')}
              error={message(formState.errors.quotedText?.message)}
              required
              readOnly={submit.isPending}
            />
            <SelectField
              {...register('reason')}
              label={t('events.report.reason')}
              error={message(formState.errors.reason?.message)}
              options={[
                { value: '', label: t('events.report.chooseReason') },
                ...eventReportReasons.map((value) => ({
                  value,
                  label: t(`events.report.reasons.${value}`),
                })),
              ]}
              required
              disabled={submit.isPending}
            />
            {submit.isError && (
              <FormError message={errorMessage(t, submit.error)} />
            )}
            <Button type="submit" loading={submit.isPending}>
              {t('events.report.submit')}
            </Button>
          </Stack>
        </form>
      )}
    </Stack>
  )
}
