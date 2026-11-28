import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { formatKoreaUpdatedAt } from '../i18n/format'
import { sharedMessages } from '../i18n/messages'
import { lastUpdatedText } from './query-state-meta'

describe('formatKoreaUpdatedAt', () => {
  it('converts UTC timestamps to Korea time (Asia/Seoul), including crossing midnight', () => {
    // 2026-11-08 18:00 UTC = 2026-11-09 03:00 KST
    const kstMorning = Date.parse('2026-11-08T18:00:00Z')
    expect(formatKoreaUpdatedAt(kstMorning, 'ko')).toContain('11')
    expect(formatKoreaUpdatedAt(kstMorning, 'ko')).toContain('09')
    expect(formatKoreaUpdatedAt(kstMorning, 'ko')).toContain('03:00')

    // 2026-11-08 15:00 UTC = 2026-11-09 00:00 KST (h23, not 24:00)
    const kstMidnight = Date.parse('2026-11-08T15:00:00Z')
    expect(formatKoreaUpdatedAt(kstMidnight, 'ko')).toContain('00:00')
    expect(formatKoreaUpdatedAt(kstMidnight, 'ko')).not.toContain('24:00')
  })

  it('formats in all four supported languages', () => {
    const ts = Date.parse('2026-11-08T18:05:00Z')
    for (const language of ['ko', 'en', 'zh', 'vi'] as const) {
      const formatted = formatKoreaUpdatedAt(ts, language)
      expect(formatted).toContain('03:05')
      expect(formatted).toContain('09')
      expect(formatted).toContain('11')
    }
  })

  it('returns an empty string when no data was ever loaded', () => {
    expect(formatKoreaUpdatedAt(0, 'ko')).toBe('')
    expect(formatKoreaUpdatedAt(-1, 'ko')).toBe('')
    expect(formatKoreaUpdatedAt(Number.NaN, 'ko')).toBe('')
    expect(formatKoreaUpdatedAt(null, 'ko')).toBe('')
    expect(formatKoreaUpdatedAt(undefined, 'ko')).toBe('')
  })
})

describe('lastUpdatedText', () => {
  it('omits the label when dataUpdatedAt is 0 or missing', () => {
    const t = ((key: string) => key) as unknown as TFunction
    expect(lastUpdatedText(t, 0, 'ko')).toBeUndefined()
    expect(lastUpdatedText(t, undefined, 'ko')).toBeUndefined()
  })

  it('builds the localized last-updated line in all four languages', () => {
    const ts = Date.parse('2026-11-08T18:00:00Z')
    const prefixes = {
      ko: '마지막으로 불러온 시각:',
      en: 'Last updated:',
      zh: '最后更新：',
      vi: 'Cập nhật lần cuối:',
    }
    for (const language of ['ko', 'en', 'zh', 'vi'] as const) {
      const template = sharedMessages[language].common.lastUpdated
      const t = ((_: string, options?: { time?: string }) =>
        template.replace(
          '{{time}}',
          options?.time ?? '',
        )) as unknown as TFunction
      const text = lastUpdatedText(t, ts, language)
      expect(text).toBeDefined()
      expect(text).toContain(prefixes[language])
      expect(text).toContain('03:00')
    }
  })
})
