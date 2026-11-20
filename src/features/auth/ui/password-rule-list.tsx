import { useTranslation } from 'react-i18next'
import { checkPasswordRules, passwordRuleKeys } from '../password-rules'
import styles from './password-rule-list.module.css'

/** ■ met / □ not met while typing (M02b). */
export function PasswordRuleList({
  password,
  email,
}: {
  password: string
  email?: string
}) {
  const { t } = useTranslation()
  const result = checkPasswordRules(password, email)
  return (
    <ul className={styles.list} aria-live="polite">
      {passwordRuleKeys.map((rule) => {
        const met = result[rule]
        return (
          <li
            key={rule}
            className={styles.item}
            data-state={password ? (met ? 'met' : 'unmet') : 'idle'}
          >
            <span className={styles.box} aria-hidden="true" />
            {t(`passwordRules.${rule}`)}
            <span className="visually-hidden">
              {' '}
              ({met ? t('common.ruleMet') : t('common.ruleUnmet')})
            </span>
          </li>
        )
      })}
    </ul>
  )
}
