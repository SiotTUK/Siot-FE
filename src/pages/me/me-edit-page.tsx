import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import { questions, type Question } from '@/features/onboarding/questions'
import { AnswerEditor } from '@/features/onboarding/ui/answer-editor'
import { NotFoundPage } from '../not-found-page'
import { answerLabels } from './answer-labels'

/** `/me/edit/:question` */
export function MeEditPage() {
  const { t } = useTranslation()
  const question = useParams().question as Question
  const { data: me } = useMe()
  if (!(question in questions)) return <NotFoundPage />
  if (!me) return null
  return (
    <AnswerEditor
      key={question}
      question={question}
      member={me}
      title={t('me.edit', { label: t(answerLabels[question]) })}
    />
  )
}
