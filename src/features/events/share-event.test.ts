import { expect, it, vi } from 'vitest'
import { shareEvent } from './share-event'

it('shares the event URL and skips copying on cancellation', async () => {
  const share = vi.fn().mockResolvedValue(undefined)
  const writeText = vi.fn()
  const url = 'https://example.com/events/2'
  expect(
    await shareEvent('Event', url, { share, clipboard: { writeText } }),
  ).toBe('shared')
  expect(share).toHaveBeenCalledWith({ title: 'Event', url })
  share.mockRejectedValue(new DOMException('Cancelled', 'AbortError'))
  expect(
    await shareEvent('Event', url, { share, clipboard: { writeText } }),
  ).toBe('cancelled')
  expect(writeText).not.toHaveBeenCalled()
})

it('copies when sharing is unavailable and offers manual copying when it fails', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  const url = 'https://example.com/events/2'
  expect(await shareEvent('Event', url, { clipboard: { writeText } })).toBe(
    'copied',
  )
  expect(writeText).toHaveBeenCalledWith(url)
  writeText.mockRejectedValue(new Error('Unavailable'))
  expect(await shareEvent('Event', url, { clipboard: { writeText } })).toBe(
    'manual',
  )
})
