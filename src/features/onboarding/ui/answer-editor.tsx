import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { MemberResponse } from '@/shared/api/types'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { BottomArea, FormError, PageHeading } from '@/shared/ui/page'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'
import { isIsoDate, requestFromMember } from '../draft'
import { questions, type Question } from '../questions'
import { useSaveOnboarding } from '../use-save-onboarding'
import { AnswerInput } from './answer-input'

/** M10: change one onboarding answer, keep the other four. */
export function AnswerEditor({
  question,
  member,
  title,
}: {
  question: Question
  member: MemberResponse
  title: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const save = useSaveOnboarding()
  const [value, setValue] = useState(member[question])
  const [invalidDate, setInvalidDate] = useState(false)
  const isDate = questions[question].kind === 'date'

  const submit = () => {
    if (isDate && value && !isIsoDate(value)) return setInvalidDate(true)
    // PUT overwrites all five answers, so start from what is saved.
    const request = requestFromMember(member, { [question]: value })
    if (request)
      save.mutate(request, {
        onSuccess: () => navigate('/me', { replace: true }),
      })
  }

  return (
    <>
      <ScreenHeader
        back={{ label: t('common.back'), to: '/me' }}
        actions={
          isDate &&
          value && (
            <HeaderAction onClick={() => setValue(null)}>
              {t('me.clearDate')}
            </HeaderAction>
          )
        }
      />
      <PageBody>
        <PageHeading title={title} description={t('me.editNotice')} />
        <AnswerInput
          question={question}
          value={value}
          error={invalidDate ? t('validation.dateFormat') : undefined}
          onChange={(answer) => {
            setInvalidDate(false)
            setValue(answer)
          }}
        />
        <BottomArea>
          {save.isError && <FormError message={errorMessage(t, save.error)} />}
          <Button loading={save.isPending} onClick={submit}>
            {t('me.save')}
          </Button>
        </BottomArea>
      </PageBody>
    </>
  )
}
