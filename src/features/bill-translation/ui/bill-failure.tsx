import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { FileErrorIcon } from '@/shared/ui/icons'
import { Card } from '@/shared/ui/page'
import type { BillTranslation } from '../api'
import styles from './bill.module.css'

// Parts shown for an unreadable result. They need a `.body` or `.theme` ancestor.

/** Why the document could not be read, with a retry button. */
export function BillFailureCard({
  result,
  onRetry,
}: {
  result: BillTranslation
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const reason = result.retake?.reason
  return (
    <Card>
      <strong className={styles.errorTitle}>
        <FileErrorIcon />
        {t('bill.recognition')}
      </strong>
      <p role="alert">
        {reason
          ? t(`bill.retake.${reason}`, {
              defaultValue: result.retake?.message,
            })
          : t('bill.tipFocus')}
      </p>
      <Button
        className={styles.secondary}
        variant="secondary"
        block
        onClick={onRetry}
      >
        {t('bill.retry')}
      </Button>
    </Card>
  )
}

export function BillPhotoTips() {
  const { t } = useTranslation()
  return (
    <ul className={styles.list}>
      <li>{t('bill.tipLight')}</li>
      <li>{t('bill.tipFrame')}</li>
      <li>{t('bill.tipFocus')}</li>
      <li>{t('bill.tipOnePage')}</li>
    </ul>
  )
}

export function BillRetakeActions({
  onAlbum,
  onRetake,
}: {
  onAlbum: () => void
  onRetake: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className={styles.actions}>
      <Button
        className={styles.secondary}
        variant="secondary"
        block
        onClick={onAlbum}
      >
        {t('bill.album')}
      </Button>
      <Button className={styles.primary} onClick={onRetake}>
        {t('bill.captureAgain')}
      </Button>
    </div>
  )
}
