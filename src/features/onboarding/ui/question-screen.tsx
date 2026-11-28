import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { MascotImage } from '@/shared/ui/mascot-image'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, Muted, PageHeading, Stack } from '@/shared/ui/page'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'
import { StepProgress } from '@/shared/ui/step-progress'
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
import styles from './question-screen.module.css'

/** Figma v2 mascot tip per screen (by textKey); the others have none. */
const tips: Partial<Record<string, 'haero' | 'toro'>> = {
  entryDate: 'toro',
  residence: 'haero',
  stayExpiry: 'haero',
}

/**
 * One F02~F06 screen (Figma v2): ‹ title header with 건너뛰기, `n / 4` step
 * bar, question, answer, mascot, then the button right after the content.
 * The last answer saves all five at once (F06).
 */
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
  const tip = tips[textKey]

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
        // The saved member is onboarded, so the onboarding route guard moves
        // on: to the screen opened before signup or login (#68), else home.
        onSuccess: clear,
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
        title={t(`onboarding.headers.${textKey}`)}
        actions={
          step && (
            <HeaderAction
              onClick={() => advance(skipValue)}
              loading={save.isPending}
            >
              {t('common.skip')}
            </HeaderAction>
          )
        }
      />
      <PageBody className={styles.body}>
        <Stack gap={16}>
          {step ? (
            <StepProgress
              current={step}
              total={stepCount}
              label={t('onboarding.step', { current: step, total: stepCount })}
            />
          ) : (
            // F02: 토로 above the question.
            <MascotImage pose="toro" />
          )}
          <PageHeading
            title={text('title')}
            description={text('description')}
          />
          <AnswerInput
            question={question}
            value={value}
            error={invalidDate ? t('validation.dateFormat') : undefined}
            onboarding
            onChange={(answer) => {
              setInvalidDate(false)
              // Single choice moves on immediately (F02, F04).
              if (kind === 'single') advance(answer)
              else setValue(answer)
            }}
          />
          {question === 'stayExpiry' && (
            // F06: 해로·토로 together before the last step.
            <MascotImage pose="hug" />
          )}
          {tip && (
            <MascotTip mascot={tip}>
              {t(`onboarding.tips.${textKey}`)}
            </MascotTip>
          )}
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
        </Stack>
      </PageBody>
    </>
  )
}
