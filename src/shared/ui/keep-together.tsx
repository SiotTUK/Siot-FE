import { Fragment } from 'react'

/** Phone numbers like 031-310-2254, 1577-1366, +82-2-1345. */
const phone = /(\+?\d{1,4}(?:-\d{1,4}){1,3})/

/**
 * Text whose phone numbers never split across lines ("031-" / "310-2254").
 * Everything else wraps normally.
 */
export function KeepTogether({ text }: { text: string }) {
  return text.split(phone).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}
