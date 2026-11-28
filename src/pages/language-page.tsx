import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { returnState } from '@/features/auth/return-path'
import { sessionState, useChangeLanguage } from '@/features/auth/use-session'
import type { Language } from '@/shared/api/types'
import { currentLanguage, isLanguage, languages } from '@/shared/i18n'
import { ChoiceCard, ChoiceList } from '@/shared/ui/choice-card'
import { MascotImage } from '@/shared/ui/mascot-image'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, Notice, PageHeading } from '@/shared/ui/page'
import { TextLink } from '@/shared/ui/text-link'
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
  const { state } = useLocation()
  const withdrawn = sessionState(state).notice === 'withdrawn'
  // #68: the protected screen to return to after signup or login.
  const carry = returnState(state)
  // "Choose your language · 选择语言 · Chọn ngôn ngữ" in the other languages.
  const others = codes.filter((code) => code !== current)

  return (
    <PageBody className={styles.language}>
      {withdrawn && <Notice tone="success">{t('withdrawal.done')}</Notice>}
      <MascotImage pose="duo" />
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
            // Nothing starts selected: the screen language is only a default
            // for the text here, not the user's choice.
            selected={false}
            onClick={() => {
              changeLanguage(language)
              navigate('/signup', { state: carry })
            }}
          />
        ))}
      </ChoiceList>
      <div className={styles.footer}>
        <Muted>{t('languagePage.autoNext')}</Muted>
        <TextLink to="/login" state={carry}>
          {t('languagePage.haveAccount')} {t('languagePage.login')}
        </TextLink>
      </div>
    </PageBody>
  )
}
