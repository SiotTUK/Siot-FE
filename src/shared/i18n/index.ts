import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Language } from '../api/types'
import type { Messages } from './define-messages'
import { sharedMessages } from './messages'

export const languages: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  vi: 'Tiếng Việt',
}
const languageKey = 'siot:language'
/** Set when a logged-out visitor picks a language, so login can keep that choice. */
const chosenBeforeLoginKey = 'siot:language-chosen'

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && value in languages
}

type StorageKind = 'localStorage' | 'sessionStorage'
function read(kind: StorageKind, key: string) {
  try {
    return globalThis[kind]?.getItem(key) ?? null
  } catch {
    return null
  }
}
function write(kind: StorageKind, key: string, value: string | null) {
  try {
    if (value === null) globalThis[kind]?.removeItem(key)
    else globalThis[kind]?.setItem(key, value)
  } catch {
    /* Storage can be unavailable. */
  }
}

/** True when this browser has picked a language before (F01 was passed). */
export function hasStoredLanguage(): boolean {
  return isLanguage(read('localStorage', languageKey))
}

export function markLanguageChosenBeforeLogin(language: Language) {
  write('sessionStorage', chosenBeforeLoginKey, language)
}

/** Returns and clears the language picked while logged out, if any. */
export function takeLanguageChosenBeforeLogin(): Language | undefined {
  const chosen = read('sessionStorage', chosenBeforeLoginKey)
  write('sessionStorage', chosenBeforeLoginKey, null)
  return isLanguage(chosen) ? chosen : undefined
}

export function currentLanguage(): Language {
  return isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'ko'
}

/** Features and pages add their own text (see app/messages.ts). */
export function registerMessages(...bundles: Partial<Messages>[]) {
  for (const bundle of bundles)
    for (const [language, text] of Object.entries(bundle))
      i18n.addResourceBundle(language, 'translation', text, true, true)
}

const saved = read('localStorage', languageKey)

void i18n.use(initReactI18next).init({
  lng: isLanguage(saved) ? saved : 'ko',
  fallbackLng: 'ko',
  supportedLngs: Object.keys(languages),
  interpolation: { escapeValue: false },
  resources: {},
})
registerMessages(sharedMessages)

if (typeof document !== 'undefined') {
  // Store a language only once it is chosen, so hasStoredLanguage() can tell
  // first-time visitors (→ F01) from returning ones (→ login).
  document.documentElement.lang = currentLanguage()
  i18n.on('languageChanged', (language) => {
    document.documentElement.lang = language
    write('localStorage', languageKey, language)
  })
}

export default i18n
