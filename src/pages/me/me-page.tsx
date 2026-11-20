import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  useChangeLanguage,
  useLogout,
  useMe,
  useWithdraw,
} from '@/features/auth/use-session'
import { residenceOptions } from '@/features/onboarding/draft'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage, translateMessage } from '@/shared/i18n/error-message'
import { Button } from '@/shared/ui/button'
import { LanguageSelect } from '@/shared/ui/language-select'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, PageHeading } from '@/shared/ui/page'
import { TextField } from '@/shared/ui/text-field'
import { editFields, type EditField } from './edit-fields'
import styles from './me.module.css'

/** M10 내 정보: saved answers (tap to change), logout, account deletion. */
export function MePage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const changeLanguage = useChangeLanguage()
  const logout = useMutation({ mutationFn: useLogout() })
  if (!me) return null

  const none = t('me.notEntered')
  const values: Record<EditField, string> = {
    userType: me.userType
      ? t(`onboarding.userType.${me.userType}.title`)
      : none,
    purpose: me.purpose ? t(`onboarding.purpose.${me.purpose}.title`) : none,
    entryDate: me.entryDate ?? none,
    stayExpiry: me.stayExpiry ?? none,
    residences:
      residenceOptions
        .filter((option) => me.residences.includes(option))
        .map((option) => t(`home.residenceShort.${option}`))
        .join(' · ') || t('home.noResidence'),
  }

  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('me.title')} />
      <dl className={styles.card}>
        <div className={styles.row}>
          <dt>{t('me.email')}</dt>
          <dd className={styles.email}>{me.email}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('me.language')}</dt>
          <dd>
            <LanguageSelect
              label={t('me.language')}
              value={currentLanguage()}
              onChange={changeLanguage}
            />
          </dd>
        </div>
        {editFields.map(({ field, labelKey }) => (
          <div key={field} className={styles.row}>
            <dt>{t(labelKey)}</dt>
            <dd>
              <Link
                className={styles.editLink}
                to={`/me/edit/${field}`}
                aria-label={`${t('me.edit', { label: t(labelKey) })}: ${values[field]}`}
              >
                <span>{values[field]}</span>
                <span aria-hidden="true">›</span>
              </Link>
            </dd>
          </div>
        ))}
      </dl>

      {me.role === 'ADMIN' && (
        <Link className={styles.adminLink} to="/admin">
          {t('admin.open')} ›
        </Link>
      )}

      <div>
        <button
          type="button"
          className={styles.logout}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {t('common.logout')}
        </button>
        {logout.isError && (
          <FormError message={errorMessage(t, logout.error)} />
        )}
      </div>

      <Withdrawal />
    </PageBody>
  )
}

function Withdrawal() {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [fieldError, setFieldError] = useState<string>()
  const withdraw = useMutation({
    mutationFn: useWithdraw(),
    onError: (error) => {
      setConfirming(false)
      // A wrong password is 400, never treated as an expired session.
      if (error instanceof ApiError && error.code === 'PASSWORD_INCORRECT')
        setFieldError('errors.PASSWORD_INCORRECT')
    },
  })

  return (
    <section className={styles.withdraw} aria-labelledby="withdraw-title">
      <h2 id="withdraw-title" className={styles.withdrawTitle}>
        {t('me.withdrawTitle')}
      </h2>
      <div className={styles.warning}>
        <strong>{t('me.withdrawWarning')}</strong>
        <ul>
          <li>{t('me.withdrawItem1')}</li>
          <li>{t('me.withdrawItem2')}</li>
          <li>{t('me.withdrawItem3')}</li>
        </ul>
      </div>
      <form
        className={styles.withdrawForm}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!password) {
            setFieldError('validation.passwordRequired')
            return
          }
          setFieldError(undefined)
          withdraw.reset()
          setConfirming(true)
        }}
      >
        <TextField
          label={t('me.password')}
          type="password"
          autoComplete="current-password"
          placeholder={t('me.passwordPlaceholder')}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setFieldError(undefined)
          }}
          error={translateMessage(t, fieldError)}
        />
        {withdraw.isError &&
          !(
            withdraw.error instanceof ApiError &&
            withdraw.error.code === 'PASSWORD_INCORRECT'
          ) && <FormError message={errorMessage(t, withdraw.error)} />}
        {confirming ? (
          <div
            className={styles.confirm}
            role="alertdialog"
            aria-labelledby="withdraw-confirm"
          >
            <p id="withdraw-confirm" className={styles.confirmTitle}>
              {t('me.withdrawConfirm')}
            </p>
            <div className={styles.confirmActions}>
              <Button
                variant="secondary"
                disabled={withdraw.isPending}
                onClick={() => setConfirming(false)}
              >
                {t('me.cancel')}
              </Button>
              <Button
                className={styles.danger}
                loading={withdraw.isPending}
                onClick={() => withdraw.mutate(password)}
              >
                {t('me.withdrawConfirmAction')}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="submit" className={styles.danger}>
            {t('me.withdraw')}
          </Button>
        )}
      </form>
    </section>
  )
}
