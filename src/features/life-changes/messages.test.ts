import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import { errorKey } from '@/shared/i18n/error-message'
import i18n, { registerMessages } from '@/shared/i18n'
import { lifeChangeMessages } from './messages'

describe('life change error messages', () => {
  it('translates LIFE_CHANGE_DATE_INVALID instead of the Korean server text', () => {
    registerMessages(lifeChangeMessages)
    const error = new ApiError(400, {
      code: 'LIFE_CHANGE_DATE_INVALID',
      message: '이사한 날은 오늘까지 입력할 수 있습니다.',
    })
    expect(errorKey(error)).toBe('errors.LIFE_CHANGE_DATE_INVALID')
    for (const language of ['en', 'zh', 'vi'] as const) {
      expect(
        lifeChangeMessages[language].errors.LIFE_CHANGE_DATE_INVALID,
      ).not.toMatch(/[가-힣]/)
    }
    expect(i18n.exists('errors.LIFE_CHANGE_DATE_INVALID')).toBe(true)
  })
})
