import type { MouseEvent } from 'react'

/**
 * Shared busy-button semantics (NFR-04, #124): while an async request is in
 * flight (`loading`), keep the button focusable with `aria-disabled` +
 * `aria-busy` instead of native `disabled` so keyboard focus does not drop to
 * `document.body`, and block duplicate clicks/submits in the click handler.
 */
export function busyButtonProps({
  disabled = false,
  loading = false,
}: {
  disabled?: boolean
  loading?: boolean
}) {
  return {
    disabled: disabled || undefined,
    'aria-disabled': loading || undefined,
    'aria-busy': loading || undefined,
  } as const
}

export function guardBusyClick<E extends Pick<MouseEvent, 'preventDefault'>>(
  busy: boolean,
  handler?: (event: E) => void,
) {
  return (event: E) => {
    if (busy) {
      event.preventDefault()
      return
    }
    handler?.(event)
  }
}
