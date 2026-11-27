import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { sessionState, useChangeLanguage } from '@/features/auth/use-session'
import type { Language } from '@/shared/api/types'
import mascots from '@/shared/assets/mascot/haero-toro.png'
import { currentLanguage, isLanguage, languages } from '@/shared/i18n'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Notice, PageHeading } from '@/shared/ui/page'
import styles from './pages.module.css'

const codes = Object.keys(languages) as Language[]

/**
 * Card subtitle (Figma v2 F01): the language's name in the screen language
 * ("English · 영어"), or in English for the screen's own language
 * ("한국어 · Korean").
 */
function languageName(language: Language, screen: Language) {
  const name = new Intl.DisplayNames([screen], { type: 'language' }).of(
    language,
  )
  if (name && name !== languages[language]) return name
  const english = new Intl.DisplayNames(['en'], { type: 'language' }).of(
    language,
  )
  return english !== languages[language] ? english : undefined
}

/**
 * F01: language comes before signup/login. Picking one goes straight to M02b.
 * Also the landing after logout and withdrawal (M-06·M-09).
 */
export function LanguagePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const changeLanguage = useChangeLanguage()
  const current = isLanguage(i18n.language) ? i18n.language : currentLanguage()
  const withdrawn = sessionState(useLocation().state).notice === 'withdrawn'
  // "Choose your language · 选择语言 · Chọn ngôn ngữ" in the other languages.
  const others = codes.filter((code) => code !== current)

  return (
    <PageBody className={styles.language}>
      {withdrawn && <Notice tone="success">{t('withdrawal.done')}</Notice>}
      <img
        className={styles.mascots}
        src={mascots}
        alt=""
        width={169}
        height={140}
      />
      <PageHeading title={t('languagePage.title')}>
        <p className={styles.subTitle}>
          {others.map((code, index) => (
            <span key={code}>
              {index > 0 && ' · '}
              <span lang={code}>{t('languagePage.title', { lng: code })}</span>
            </span>
          ))}
        </p>
      </PageHeading>
      <ChoiceList>
        {codes.map((language) => (
          <ChoiceCard
            key={language}
            lang={language}
            title={languages[language]}
            description={languageName(language, current)}
            selected={language === current}
            onClick={() => {
              changeLanguage(language)
              navigate('/signup')
            }}
          />
        ))}
      </ChoiceList>
      <div className={styles.footer}>
        <Muted>{t('languagePage.autoNext')}</Muted>
        <Link to="/login" className={styles.footerLink}>
          {t('languagePage.haveAccount')} {t('languagePage.login')}
        </Link>
      </div>
    </PageBody>
  )
}
