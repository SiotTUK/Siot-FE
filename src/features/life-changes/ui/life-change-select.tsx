import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { chatBackPath } from '@/shared/lib/chat-back'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatCalendarDate, koreaToday } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { TextField } from '@/shared/ui/field'
import { PageBody } from '@/shared/ui/mobile-frame'
import { BottomArea, FormError, Muted, PageHeading } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { ScreenHeader } from '@/shared/ui/screen-header'
import {
  isLifeChangeCode,
  lifeChangeCodes,
  type LifeChangeCode,
} from '../life-changes'
import { useChangeLifeChange, useLifeChanges } from '../use-life-changes'
import { LifeChangeTypeIcon } from './life-change-icon'
import styles from './life-changes.module.css'

const isoDate = /^\d{4}-\d{2}-\d{2}$/

/**
 * Figma v2 F06a 생활 변화 등록: choose what changed, when, then "할 일 보기"
 * saves it and opens that change's tasks. A change that is already
 * registered starts with its saved date; `?code=LC-01` (F06b "수정") opens
 * with that change chosen.
 */
export function LifeChangeSelect({ memberId }: { memberId: number }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  // Opened from a chat related page (CB-10): keep the way back to the conversation.
  const { state } = useLocation()
  const chat = chatBackPath(state)
  const changes = useLifeChanges(memberId)
  const [params] = useSearchParams()
  const preset = params.get('code')
  const [code, setCode] = useState<LifeChangeCode | undefined>(
    isLifeChangeCode(preset) ? preset : undefined,
  )
  // undefined = not edited yet: show the saved date once it has loaded.
  const [input, setInput] = useState<string>()
  const [error, setError] = useState<string>()
  const mutation = useChangeLifeChange(memberId, code ?? 'LC-01')
  const saved = new Map(
    changes.data?.map((entry) => [entry.lifeChangeCode, entry.baseDate]),
  )
  const savedDate = code && saved.get(code)
  const date = input ?? savedDate ?? ''
  const move = code === 'LC-01'
  // With eight choices the date field sits below the fold; bring it up.
  const when = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!code) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    when.current?.scrollIntoView({
      block: 'center',
      behavior: still ? 'auto' : 'smooth',
    })
  }, [code])

  const submit = () => {
    if (!code) return
    if (!isoDate.test(date)) return setError(t('lifeChanges.invalidDate'))
    if (move && date > koreaToday())
      return setError(t('lifeChanges.futureMove'))
    const tasks = () => navigate(`/home/life-changes/${code}`, { state })
    if (date === savedDate) return tasks()
    mutation.apply({ action: 'save', baseDate: date }, tasks)
  }

  return (
    <>
      <ScreenHeader
        title={t('lifeChanges.trigger')}
        back={
          chat
            ? { label: t('common.back'), to: chat }
            : { label: t('lifeChanges.backHome'), to: '/home' }
        }
      />
      <PageBody>
        <PageHeading
          title={t('lifeChanges.selectTitle')}
          description={t('lifeChanges.pickerHint')}
        />
        <QueryState query={changes}>
          <ChoiceList grouped>
            {lifeChangeCodes.map((option) => {
              const registered = saved.get(option)
              return (
                <ChoiceCard
                  key={option}
                  icon={<LifeChangeTypeIcon code={option} />}
                  title={t(`lifeChanges.types.${option}.title`)}
                  description={
                    registered
                      ? `${t(`lifeChanges.types.${option}.hint`)} · ${t(
                          'lifeChanges.registered',
                          {
                            date: formatCalendarDate(registered, i18n.language),
                          },
                        )}`
                      : t(`lifeChanges.types.${option}.hint`)
                  }
                  selected={option === code}
                  onClick={() => {
                    setCode(option)
                    setInput(undefined)
                    setError(undefined)
                    mutation.reset()
                  }}
                />
              )
            })}
          </ChoiceList>
          {code && (
            <div ref={when} className={styles.when}>
              <TextField
                label={t(`lifeChanges.types.${code}.date`)}
                type="date"
                required
                value={date}
                max={move ? koreaToday() : undefined}
                disabled={mutation.isPending}
                error={error}
                onChange={(event) => {
                  setInput(event.target.value)
                  setError(undefined)
                }}
              />
              {savedDate && date !== savedDate && (
                <Muted>{t('lifeChanges.dateChanged')}</Muted>
              )}
            </div>
          )}
        </QueryState>
        <BottomArea>
          {mutation.isError && (
            <FormError message={errorMessage(t, mutation.error)} />
          )}
          <Button
            disabled={!code || !date}
            loading={mutation.isPending}
            onClick={submit}
          >
            {t('lifeChanges.showTasks')}
          </Button>
        </BottomArea>
      </PageBody>
    </>
  )
}
