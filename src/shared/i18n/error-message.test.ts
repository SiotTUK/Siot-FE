import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { errorKey } from './error-message'
import i18n from './index'

// BE GlobalExceptionHandler codes that any endpoint can return (FE #51).
const commonCodes = [
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'UNSUPPORTED_MEDIA_TYPE',
] as const

describe('errorKey', () => {
  afterEach(async () => {
    await i18n.changeLanguage('ko')
  })

  it.each(commonCodes)(
    'translates the BE common code %s instead of showing Korean',
    async (code) => {
      const key = errorKey(new ApiError(404, { code, message: '한국어 문구' }))
      expect(key).toBe(`errors.${code}`)
      for (const language of ['ko', 'en', 'zh', 'vi']) {
        await i18n.changeLanguage(language)
        const text = i18n.t(key)
        expect(text).not.toBe(key)
        if (language !== 'ko') expect(text).not.toMatch(/[가-힣]/)
      }
    },
  )
})
