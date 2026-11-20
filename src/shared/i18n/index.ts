import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Language } from '../api/types'
import { en } from './locales/en'
import { ko } from './locales/ko'
import { vi } from './locales/vi'
import { zh } from './locales/zh'

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

function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

function writeStorage(
  storage: () => Storage,
  key: string,
  value: string | null,
) {
  try {
    if (value === null) storage().removeItem(key)
    else storage().setItem(key, value)
  } catch {
    /* Storage can be unavailable. */
  }
}

/** True when this browser has picked a language before (F01 was passed). */
export function hasStoredLanguage(): boolean {
  return isLanguage(readStorage(() => localStorage, languageKey))
}

export function markLanguageChosenBeforeLogin(language: Language) {
  writeStorage(() => sessionStorage, chosenBeforeLoginKey, language)
}

/** Returns and clears the language picked while logged out, if any. */
export function takeLanguageChosenBeforeLogin(): Language | undefined {
  const chosen = readStorage(() => sessionStorage, chosenBeforeLoginKey)
  writeStorage(() => sessionStorage, chosenBeforeLoginKey, null)
  return isLanguage(chosen) ? chosen : undefined
}

export function currentLanguage(): Language {
  return isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'ko'
}

const saved = readStorage(() => localStorage, languageKey)

void i18n.use(initReactI18next).init({
  lng: isLanguage(saved) ? saved : 'ko',
  fallbackLng: 'ko',
  supportedLngs: Object.keys(languages),
  interpolation: { escapeValue: false },
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    zh: { translation: zh },
    vi: { translation: vi },
  },
})

function syncLanguage(language: string) {
  document.documentElement.lang = language
  writeStorage(() => localStorage, languageKey, language)
}

if (typeof document !== 'undefined') {
  // Only store a language once it is actually chosen, so hasStoredLanguage()
  // can tell first-time visitors (→ F01) from returning ones (→ login).
  document.documentElement.lang = currentLanguage()
  i18n.on('languageChanged', syncLanguage)
}

export default i18n
