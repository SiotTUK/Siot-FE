import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useChangeLanguage } from '@/features/auth/use-session'
import type { Language } from '@/shared/api/types'
import { currentLanguage, languages } from '@/shared/i18n'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { PageBody } from '@/shared/ui/mobile-frame'
import { BottomArea, InlineLink, PageHeading } from '@/shared/ui/page'
import styles from './pages.module.css'

/** F01: language comes before signup/login. Picking one goes straight to M02b. */
export function LanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const changeLanguage = useChangeLanguage()
  const current = currentLanguage()

  const choose = (language: Language) => {
    changeLanguage(language)
    navigate('/signup')
  }

  return (
    <PageBody className={styles.languageBody}>
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
            onClick={() => choose(language)}
          />
        ))}
      </ChoiceList>
      <BottomArea>
        <p className={styles.hint}>{t('languagePage.autoNext')}</p>
        <InlineLink text={t('languagePage.haveAccount')}>
          <Link to="/login">{t('languagePage.login')}</Link>
        </InlineLink>
      </BottomArea>
    </PageBody>
  )
}
