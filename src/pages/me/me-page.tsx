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
import type { Question } from '@/features/onboarding/questions'
import { describeAnswer } from '@/features/onboarding/summary'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { Button, ButtonLink } from '@/shared/ui/button'
import { ChevronRightIcon } from '@/shared/ui/icons'
import { LanguageSelect } from '@/shared/ui/language-select'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, PageHeading } from '@/shared/ui/page'
import { answerLabels } from './answer-labels'
import styles from './me.module.css'

/** Figma v2 M10 row order; "알림 설정" sits after 체류 만료일. */
const rowOrder: (Question | 'notifications')[] = [
  'userType',
  'stayExpiry',
  'notifications',
  'entryDate',
  'purpose',
  'residences',
]

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
      <MascotTip mascot="toro">{t('me.tip')}</MascotTip>
      <div className={styles.card}>
        <dl className={styles.email}>
          <dt>{t('me.email')}</dt>
          <dd>{me.email}</dd>
          {/* #72: the sign-up email is the only address; it also receives notification and reset emails. */}
          <dd className={styles.emailUse}>
            {t(me.emailVerified ? 'me.emailUse' : 'me.emailUseUnverified')}
          </dd>
        </dl>
        <LanguageSelect
          label={t('me.language')}
          value={currentLanguage()}
          onChange={changeLanguage}
          variant="field"
        />
        <dl className={styles.rows}>
          {rowOrder.map((question) => {
            if (question === 'notifications')
              return (
                <div key={question}>
                  <dt>{t('me.notificationRow')}</dt>
                  <dd>
                    <Link to="/notifications#settings">
                      {t('me.notificationValue')} <ChevronRightIcon />
                    </Link>
                  </dd>
                </div>
              )
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
        loading={logout.isPending}
        onClick={() => logout.mutate()}
      >
        {t('common.logout')}
      </Button>
      {logout.isError && <FormError message={errorMessage(t, logout.error)} />}
      <WithdrawalForm />
    </PageBody>
  )
}
