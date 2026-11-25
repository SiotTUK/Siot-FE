import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { KeepTogether } from './keep-together'

const kept = (text: string) =>
  (
    KeepTogether({ text }) as ReactElement<{
      className?: string
      children: string
    }>[]
  )
    .filter((part) => part.props.className === 'nowrap')
    .map((part) => part.props.children)

describe('KeepTogether', () => {
  it('keeps phone numbers on one line', () => {
    expect(kept('시흥시 자원순환과 031-310-2254 (평일 09:30~18:00)')).toEqual([
      '031-310-2254',
    ])
    expect(kept('다누리 1577-1366 / 해외 +82-2-1345')).toEqual([
      '1577-1366',
      '+82-2-1345',
    ])
  })

  it('leaves text without numbers alone', () => {
    expect(kept('일~금요일 18:00~다음 날 06:00')).toEqual([])
    expect(kept('16–31 August')).toEqual([])
  })
})
