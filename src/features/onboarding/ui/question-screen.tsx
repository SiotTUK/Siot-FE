import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { BottomArea, FormError, Muted, PageHeading } from '@/shared/ui/page'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'
import { isIsoDate, toOnboardingRequest, type OnboardingDraft } from '../draft'
import { useOnboardingDraft } from '../onboarding-context'
import {
  onboardingPath,
  questionOrder,
  questions,
  stepCount,
  type Question,
} from '../questions'
import { useSaveOnboarding } from '../use-save-onboarding'
import { AnswerInput } from './answer-input'

/** One F02~F06 screen. The last answer saves all five at once (F06). */
export function QuestionScreen({ question }: { question: Question }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, update, clear } = useOnboardingDraft()
  const save = useSaveOnboarding()
  const [value, setValue] = useState(draft[question])
  const [invalidDate, setInvalidDate] = useState(false)

  const { kind, textKey, step } = questions[question]
  const index = questionOrder.indexOf(question)
  const previous = questionOrder[index - 1]
  const next = questionOrder[index + 1]
  const text = (key: string) => t(`onboarding.${textKey}.${key}`)

  /** Store the answer, then go on — or save everything after the last one. */
  const advance = (answer: OnboardingDraft[Question]) => {
    if (kind === 'date' && answer && !isIsoDate(answer))
      return setInvalidDate(true)
    const updated = { ...draft, [question]: answer }
    update({ [question]: answer })
    if (next) return navigate(onboardingPath(next))
    const request = toOnboardingRequest(updated)
    if (request)
      save.mutate(request, {
        onSuccess: () => {
          navigate('/home', { replace: true })
          clear()
        },
      })
  }
  const skipValue = kind === 'multi' ? [] : null

  return (
    <>
      <ScreenHeader
        back={
          previous && {
            label: t('common.back'),
            onClick: () => navigate(onboardingPath(previous)),
          }
        }
        actions={
          step && (
            <HeaderAction
              onClick={() => advance(skipValue)}
              disabled={save.isPending}
            >
              {t('common.skip')}
            </HeaderAction>
          )
        }
        progress={
          step
            ? {
                current: step,
                total: stepCount,
                label: t('onboarding.step', {
                  current: step,
                  total: stepCount,
                }),
              }
            : undefined
        }
      />
      <PageBody>
        <PageHeading title={text('title')} description={text('description')} />
        <AnswerInput
          question={question}
          value={value}
          error={invalidDate ? t('validation.dateFormat') : undefined}
          onChange={(answer) => {
            setInvalidDate(false)
            // Single choice moves on immediately (F02, F04).
            if (kind === 'single') advance(answer)
            else setValue(answer)
          }}
        />
        <BottomArea>
          {kind === 'single' ? (
            <Muted>{t('onboarding.autoNext')}</Muted>
          ) : (
            <>
              {save.isError && (
                <FormError message={errorMessage(t, save.error)} />
              )}
              <Button loading={save.isPending} onClick={() => advance(value)}>
                {next ? t('common.next') : text('submit')}
              </Button>
            </>
          )}
        </BottomArea>
      </PageBody>
    </>
  )
}
