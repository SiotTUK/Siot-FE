import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './button'
import { Stack } from './page'
import styles from './document.module.css'

export function Sheet({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-labelledby={id}
      onCancel={onClose}
    >
      <Stack gap={12}>
        <h2 id={id}>{title}</h2>
        {children}
        <Button variant="text" onClick={onClose}>
          {closeLabel}
        </Button>
      </Stack>
    </dialog>
  )
}
