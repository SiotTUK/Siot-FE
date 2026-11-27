import { describe, expect, it } from 'vitest'
import { isOnContainedImage } from './contain-box'

describe('isOnContainedImage', () => {
  const box = { width: 400, height: 800 }

  it('excludes the bars above and below a wide picture', () => {
    // Drawn 400×200, from y 300 to 500.
    const wide = { width: 1600, height: 800 }
    expect(isOnContainedImage({ x: 200, y: 400 }, box, wide)).toBe(true)
    expect(isOnContainedImage({ x: 200, y: 299 }, box, wide)).toBe(false)
    expect(isOnContainedImage({ x: 200, y: 501 }, box, wide)).toBe(false)
  })

  it('excludes the bars beside a tall picture', () => {
    // Drawn 200×800, from x 100 to 300.
    const tall = { width: 100, height: 400 }
    expect(isOnContainedImage({ x: 101, y: 10 }, box, tall)).toBe(true)
    expect(isOnContainedImage({ x: 99, y: 400 }, box, tall)).toBe(false)
    expect(isOnContainedImage({ x: 301, y: 400 }, box, tall)).toBe(false)
  })

  it('treats a picture without a size as empty', () => {
    const none = { width: 0, height: 0 }
    expect(isOnContainedImage({ x: 200, y: 400 }, box, none)).toBe(false)
  })
})
