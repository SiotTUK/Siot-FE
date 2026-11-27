import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Muted } from '@/shared/ui/page'
import styles from './bill.module.css'

/**
 * Waiting status of one upload; the delay notice counts from mount, so mount
 * it once per request. Needs a `.body` or `.theme` ancestor.
 */
export function BillProcessingCard({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const [delayed, setDelayed] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayed(true), 10_000)
    return () => window.clearTimeout(timer)
  }, [])
  return (
    <Card>
      <div className={styles.status} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <div>
          <strong>{t('bill.processing')}</strong>
          <Muted>
            {t(delayed ? 'bill.delayed' : 'bill.processingDetails')}
          </Muted>
        </div>
      </div>
      {children}
    </Card>
  )
}
