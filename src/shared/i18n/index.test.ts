import { afterEach, describe, expect, it } from 'vitest'
import i18n, { currentLanguage } from './index'

describe('currentLanguage', () => {
  afterEach(async () => {
    await i18n.changeLanguage('ko')
  })

  it('uses the chosen language before i18next resolves it after startup', async () => {
    await i18n.changeLanguage('en')
    // Right after `init`, i18next leaves resolvedLanguage empty until the
    // language is changed once (message bundles are added later).
    const resolved = i18n.resolvedLanguage
    Object.assign(i18n, { resolvedLanguage: undefined })
    try {
      expect(i18n.language).toBe('en')
      expect(currentLanguage()).toBe('en')
    } finally {
      Object.assign(i18n, { resolvedLanguage: resolved })
    }
  })

  it('falls back to Korean for an unsupported language', async () => {
    await i18n.changeLanguage('fr')
    Object.assign(i18n, { resolvedLanguage: undefined })
    expect(currentLanguage()).toBe('ko')
  })
})
