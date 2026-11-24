import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  useChangeLanguage,
  useLogout,
  useMe,
} from '@/features/auth/use-session'
import { EmailVerificationForm } from '@/features/auth/ui/email-verification-form'
import { WithdrawalForm } from '@/features/auth/ui/withdrawal-form'
import { questionOrder } from '@/features/onboarding/questions'
import { describeAnswer } from '@/features/onboarding/summary'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button, ButtonLink } from '@/shared/ui/button'
import { ChevronRightIcon } from '@/shared/ui/icons'
import { LanguageSelect } from '@/shared/ui/language-select'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, PageHeading } from '@/shared/ui/page'
import { answerLabels } from './answer-labels'
import styles from './me.module.css'

/** M10 내 정보: email verification (NTF-09), saved answers (tap to change), logout, account deletion. */
export function MePage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const changeLanguage = useChangeLanguage()
  const logout = useMutation({ mutationFn: useLogout() })
  if (!me) return null

  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('me.title')} />
      <div className={styles.card}>
        <dl className={styles.email}>
          <dt>{t('me.email')}</dt>
          <dd>{me.email}</dd>
        </dl>
        <LanguageSelect
          label={t('me.language')}
          value={currentLanguage()}
          onChange={changeLanguage}
          variant="field"
        />
        <dl className={styles.rows}>
          {questionOrder.map((question) => {
            const label = t(answerLabels[question])
            const value = describeAnswer(t, question, me)
            return (
              <div key={question}>
                <dt>{label}</dt>
                <dd>
                  <Link
                    to={`/me/edit/${question}`}
                    aria-label={`${t('me.edit', { label })}: ${value}`}
                  >
                    {value} <ChevronRightIcon />
                  </Link>
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
      {!me.emailVerified && <EmailVerificationForm />}
      {me.role === 'ADMIN' && (
        <ButtonLink variant="secondary" to="/admin">
          {t('admin.open')} ›
        </ButtonLink>
      )}
      <Button
        variant="secondary"
        block
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        {t('common.logout')}
      </Button>
      {logout.isError && <FormError message={errorMessage(t, logout.error)} />}
      <WithdrawalForm />
    </PageBody>
  )
}
