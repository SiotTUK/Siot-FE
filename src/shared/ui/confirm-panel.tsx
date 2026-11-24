import { Button } from './button'
import styles from './confirm-panel.module.css'

/** In-page "are you sure?" step for actions that cannot be undone. */
export function ConfirmPanel({
  message,
  confirmLabel,
  cancelLabel,
  pending,
  danger,
  onConfirm,
  onCancel,
}: {
  message: string
  confirmLabel: string
  cancelLabel: string
  pending?: boolean
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className={styles.panel} role="alertdialog" aria-label={message}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" block disabled={pending} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          loading={pending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
