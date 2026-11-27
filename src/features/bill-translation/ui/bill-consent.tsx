import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { CheckField } from '@/shared/ui/field'
import { FormError, Notice, Stack } from '@/shared/ui/page'
import { Sheet } from '@/shared/ui/sheet'
import styles from './bill.module.css'

type ConsentProps = {
  consent: boolean
  onConsentChange: (consent: boolean) => void
  /** Reachable only while `consent` is checked. */
  onAgree: () => void
  error?: string
}

/**
 * External AI notice, consent check and translate button. Returns siblings so
 * the surrounding stack spaces them; needs a `.body` or `.theme` ancestor.
 */
export function BillConsent({
  title,
  consent,
  onConsentChange,
  onAgree,
  error,
}: ConsentProps & { title?: string }) {
  const { t } = useTranslation()
  return (
    <>
      <Notice title={title}>{t('bill.privacy')}</Notice>
      <CheckField
        label={t('bill.agree')}
        checked={consent}
        onChange={(event) => onConsentChange(event.target.checked)}
      />
      <FormError message={error} />
      <Button className={styles.primary} disabled={!consent} onClick={onAgree}>
        {t('bill.translate')}
      </Button>
    </>
  )
}

/** The same consent step as a bottom sheet over the current screen. */
export function BillConsentSheet({
  onClose,
  ...consent
}: ConsentProps & { onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Sheet
      title={t('bill.consentTitle')}
      closeLabel={t('common.cancel')}
      onClose={onClose}
    >
      <div className={styles.theme}>
        <Stack gap={12}>
          <BillConsent {...consent} />
        </Stack>
      </div>
    </Sheet>
  )
}
