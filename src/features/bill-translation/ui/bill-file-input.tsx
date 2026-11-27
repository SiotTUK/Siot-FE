import type { Ref } from 'react'
import { validateBillFile } from '../bill-translation'

/**
 * Hidden file picker opened through its ref. Only a file that matches `accept`
 * and the size limit reaches `onSelect`.
 */
export function BillFileInput({
  ref,
  accept,
  capture,
  onSelect,
  onReject,
}: {
  ref: Ref<HTMLInputElement>
  accept: string
  capture?: 'environment'
  onSelect: (file: File) => void
  onReject: (code: NonNullable<ReturnType<typeof validateBillFile>>) => void
}) {
  return (
    <input
      hidden
      ref={ref}
      type="file"
      accept={accept}
      capture={capture}
      onChange={(event) => {
        const file = event.currentTarget.files?.[0]
        // Cleared so that picking the same file again still fires a change.
        event.currentTarget.value = ''
        if (!file) return
        const error = validateBillFile(file, accept)
        if (error) onReject(error)
        else onSelect(file)
      }}
    />
  )
}
