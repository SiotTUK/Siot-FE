import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import { billBackPath } from '@/features/bill-translation/bill-translation'
import { BillResult } from '@/features/bill-translation/ui/bill-result'
import { BillUpload } from '@/features/bill-translation/ui/bill-upload'
import styles from '@/features/bill-translation/ui/bill.module.css'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'

export function BillUploadPage() {
  const { data: member } = useMe()
  return member && <BillUpload key={member.id} memberId={member.id} />
}

export function BillResultPage() {
  const { data: member } = useMe()
  const { t } = useTranslation()
  const { id } = useParams()
  const { state } = useLocation()
  const translationId = Number(id)
  return (
    <>
      <ScreenHeader
        title={t('bill.result')}
        back={{ label: t('common.back'), to: billBackPath(state) }}
      />
      <PageBody className={styles.body}>
        {member &&
        /^\d+$/.test(id ?? '') &&
        Number.isSafeInteger(translationId) &&
        translationId > 0 ? (
          <BillResult
            key={`${member.id}:${translationId}`}
            memberId={member.id}
            id={translationId}
          />
        ) : (
          <FormError message={t('bill.errors.BILL_TRANSLATION_NOT_FOUND')} />
        )}
      </PageBody>
    </>
  )
}
