import { describe, expect, it } from 'vitest'
import { formatDocumentTitle, routeTitleKey } from './document-title'

describe('formatDocumentTitle', () => {
  it('joins screen name and brand across languages', () => {
    expect(formatDocumentTitle('웰컴시흥', '홈')).toBe('홈 · 웰컴시흥')
    expect(formatDocumentTitle('Welcome Siheung', 'Home')).toBe(
      'Home · Welcome Siheung',
    )
    expect(formatDocumentTitle('欢迎来到始兴', '首页')).toBe(
      '首页 · 欢迎来到始兴',
    )
    expect(formatDocumentTitle('Chào mừng đến Siheung', 'Trang chủ')).toBe(
      'Trang chủ · Chào mừng đến Siheung',
    )
  })

  it('includes item title on detail screens and falls back cleanly while loading or on error', () => {
    expect(
      formatDocumentTitle('웰컴시흥', '한국어 무료 강좌', '행사 상세'),
    ).toBe('한국어 무료 강좌 · 행사 상세 · 웰컴시흥')
    expect(formatDocumentTitle('웰컴시흥', undefined, '행사 상세')).toBe(
      '행사 상세 · 웰컴시흥',
    )
    expect(formatDocumentTitle('웰컴시흥', null, '할 일 상세')).toBe(
      '할 일 상세 · 웰컴시흥',
    )
    expect(formatDocumentTitle('웰컴시흥', '   ', '')).toBe('웰컴시흥')
  })

  it('deduplicates identical segments and brand name', () => {
    expect(formatDocumentTitle('웰컴시흥', '웰컴시흥')).toBe('웰컴시흥')
    expect(formatDocumentTitle('웰컴시흥', '생활 안내', '생활 안내')).toBe(
      '생활 안내 · 웰컴시흥',
    )
  })
})

describe('routeTitleKey', () => {
  it('picks the deepest matched route handle with titleKey', () => {
    expect(
      routeTitleKey([
        { handle: undefined },
        { handle: { titleKey: 'admin.title' } },
        { handle: { titleKey: 'admin.menuReports' } },
      ]),
    ).toBe('admin.menuReports')
    expect(routeTitleKey([{ handle: null }, { handle: {} }])).toBeUndefined()
  })
})
