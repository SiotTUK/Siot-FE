import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { meQueryKey } from '@/features/auth/api'
import { useMe } from '@/features/auth/use-session'
import { saveOnboarding } from '@/features/onboarding/api'
import {
  isIsoDate,
  requestFromMember,
  residenceOptions,
  stayPurposes,
  userTypes,
  type OnboardingRequest,
} from '@/features/onboarding/draft'
import { ApiError } from '@/shared/api/client'
import type { MemberResponse } from '@/shared/api/types'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { PageBody } from '@/shared/ui/mobile-frame'
import {
  BottomArea,
  FormError,
  Notice,
  PageHeading,
  Stack,
} from '@/shared/ui/page'
import { StepHeader } from '@/shared/ui/step-header'
import { TextField } from '@/shared/ui/text-field'
import { NotFoundPage } from '../not-found-page'
import { editFields, isEditField, type EditField } from './edit-fields'
import styles from './me.module.css'

/** `/me/edit/:field` — change one onboarding answer, keep the other four. */
export function MeEditPage() {
  const { field } = useParams()
  const { data: me } = useMe()
  if (!isEditField(field)) return <NotFoundPage />
  if (!me) return null
  return <EditForm key={field} field={field} member={me} />
}

function initialValue(field: EditField, member: MemberResponse) {
  return member[field]
}

function EditForm({
  field,
  member,
}: {
  field: EditField
  member: MemberResponse
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [value, setValue] = useState(() => initialValue(field, member))
  const [invalidDate, setInvalidDate] = useState(false)
  const labelKey = editFields.find((item) => item.field === field)!.labelKey

  const save = useMutation({
    mutationFn: saveOnboarding,
    onSuccess: (updated) => {
      queryClient.setQueryData(meQueryKey, updated)
      navigate('/me', { replace: true })
    },
    onError: (error) => {
      // Session expired: the route guard sends them to login.
      if (error instanceof ApiError && error.status === 401)
        queryClient.setQueryData(meQueryKey, null)
    },
  })

  const submit = () => {
    if (
      (field === 'entryDate' || field === 'stayExpiry') &&
      value !== null &&
      !isIsoDate(value)
    )
      return setInvalidDate(true)
    const request = requestFromMember(member, {
      [field]: value,
    } as Partial<OnboardingRequest>)
    if (request) save.mutate(request)
  }

  return (
    <>
      <StepHeader backLabel={t('common.back')} onBack={() => navigate('/me')} />
      <PageBody className={styles.editBody}>
        <PageHeading
          title={t('me.edit', { label: t(labelKey) })}
          description={t('me.editNotice')}
        />
        <form
          className={styles.editForm}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          {field === 'userType' && (
            <ChoiceList>
              {userTypes.map((option) => (
                <ChoiceCard
                  key={option}
                  title={t(`onboarding.userType.${option}.title`)}
                  description={t(`onboarding.userType.${option}.description`)}
                  selected={value === option}
                  onClick={() => setValue(option)}
                />
              ))}
            </ChoiceList>
          )}
          {field === 'purpose' && (
            <ChoiceList>
              {stayPurposes.map((option) => (
                <ChoiceCard
                  key={option}
                  title={t(`onboarding.purpose.${option}.title`)}
                  description={t(`onboarding.purpose.${option}.description`)}
                  selected={value === option}
                  onClick={() => setValue(option)}
                />
              ))}
            </ChoiceList>
          )}
          {field === 'residences' && Array.isArray(value) && (
            <ChoiceList>
              {residenceOptions.map((option) => (
                <ChoiceCard
                  key={option}
                  indicator="checkbox"
                  title={t(`onboarding.residence.${option}`)}
                  selected={value.includes(option)}
                  onClick={() =>
                    setValue(
                      value.includes(option)
                        ? value.filter((item) => item !== option)
                        : [...value, option],
                    )
                  }
                />
              ))}
            </ChoiceList>
          )}
          {(field === 'entryDate' || field === 'stayExpiry') && (
            <Stack gap={12}>
              <TextField
                label={t(labelKey)}
                type="date"
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => {
                  setValue(event.target.value || null)
                  setInvalidDate(false)
                }}
                error={invalidDate ? t('validation.dateFormat') : undefined}
              />
              <Button
                variant="secondary"
                disabled={value === null}
                onClick={() => setValue(null)}
              >
                {t('me.clearDate')}
              </Button>
              <Notice tone="note">
                {t(
                  field === 'entryDate'
                    ? 'onboarding.entryDate.note'
                    : 'onboarding.stayExpiry.note',
                )}
              </Notice>
            </Stack>
          )}
          <BottomArea>
            <Stack gap={12}>
              {save.isError && (
                <FormError message={errorMessage(t, save.error)} />
              )}
              <Button type="submit" loading={save.isPending}>
                {t('me.save')}
              </Button>
            </Stack>
          </BottomArea>
        </form>
      </PageBody>
    </>
  )
}
