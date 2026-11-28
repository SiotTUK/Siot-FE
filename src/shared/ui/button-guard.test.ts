import { describe, expect, it, vi } from 'vitest'
import { busyButtonProps, guardBusyClick } from './button-guard'

describe('busyButtonProps', () => {
  it('keeps focusable via aria-disabled and aria-busy while loading without setting native disabled', () => {
    expect(busyButtonProps({ loading: true })).toEqual({
      disabled: undefined,
      'aria-disabled': true,
      'aria-busy': true,
    })
  })

  it('sets native disabled when explicitly disabled and not loading', () => {
    expect(busyButtonProps({ disabled: true })).toEqual({
      disabled: true,
      'aria-disabled': undefined,
      'aria-busy': undefined,
    })
  })

  it('returns no disabled or busy attributes when idle', () => {
    expect(busyButtonProps({})).toEqual({
      disabled: undefined,
      'aria-disabled': undefined,
      'aria-busy': undefined,
    })
  })
})

describe('guardBusyClick', () => {
  it('prevents default and skips handler while busy to stop duplicate requests or submits', () => {
    const preventDefault = vi.fn()
    const handler = vi.fn()
    guardBusyClick(true, handler)({ preventDefault })
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(handler).not.toHaveBeenCalled()
  })

  it('forwards the click event to handler when not busy', () => {
    const preventDefault = vi.fn()
    const handler = vi.fn()
    const event = { preventDefault }
    guardBusyClick(false, handler)(event)
    expect(preventDefault).not.toHaveBeenCalled()
    expect(handler).toHaveBeenCalledWith(event)
  })
})
