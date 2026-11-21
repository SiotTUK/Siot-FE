import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { sessionState, useChangeLanguage } from '@/features/auth/use-session'
import type { Language } from '@/shared/api/types'
import { currentLanguage, languages } from '@/shared/i18n'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { PageBody } from '@/shared/ui/mobile-frame'
import {
  BottomArea,
  InlineLink,
  Muted,
  Notice,
  PageHeading,
} from '@/shared/ui/page'
import styles from './pages.module.css'

/**
 * F01: language comes before signup/login. Picking one goes straight to M02b.
 * Also the landing after logout and withdrawal (M-06·M-09).
 */
export function LanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const changeLanguage = useChangeLanguage()
  const current = currentLanguage()
  const withdrawn = sessionState(useLocation().state).notice === 'withdrawn'

  return (
    <PageBody className={styles.language}>
      {withdrawn && <Notice tone="success">{t('withdrawal.done')}</Notice>}
      <p className={styles.brand}>{t('common.brand')}</p>
      <PageHeading title={t('languagePage.title')}>
        {current !== 'en' && (
          <p className={styles.subTitle} lang="en">
            {t('languagePage.title', { lng: 'en' })}
          </p>
        )}
      </PageHeading>
      <ChoiceList>
        {(Object.keys(languages) as Language[]).map((language) => (
          <ChoiceCard
            key={language}
            lang={language}
            title={languages[language]}
            selected={language === current}
            onClick={() => {
              changeLanguage(language)
              navigate('/signup')
            }}
          />
        ))}
      </ChoiceList>
      <BottomArea>
        <div className={styles.center}>
          <Muted>{t('languagePage.autoNext')}</Muted>
          <InlineLink text={t('languagePage.haveAccount')}>
            <Link to="/login">{t('languagePage.login')}</Link>
          </InlineLink>
        </div>
      </BottomArea>
    </PageBody>
  )
}
