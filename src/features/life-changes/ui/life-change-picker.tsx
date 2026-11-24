import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatCalendarDate } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { QueryState } from '@/shared/ui/query-state'
import { lifeChangeCodes } from '../life-changes'
import { useLifeChanges } from '../use-life-changes'
import styles from './life-changes.module.css'

export function LifeChangePicker({ memberId }: { memberId: number }) {
  const { t, i18n } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const [open, setOpen] = useState(false)
  const changes = useLifeChanges(memberId, open)
  const dates = new Map(
    changes.data?.map((entry) => [entry.lifeChangeCode, entry.baseDate]),
  )

  return (
    <>
      <button
        className={styles.trigger}
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal()
          setOpen(true)
        }}
      >
        {t('lifeChanges.trigger')}
        <span aria-hidden="true">›</span>
      </button>
      <dialog
        ref={dialog}
        className={styles.sheet}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setOpen(false)}
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.sheetHeader}>
          <div>
            <h2 id={titleId}>{t('lifeChanges.pickerTitle')}</h2>
            <p id={descriptionId}>{t('lifeChanges.pickerHint')}</p>
          </div>
          <Button
            variant="text"
            aria-label={t('lifeChanges.close')}
            onClick={() => dialog.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        {open && (
          <QueryState query={changes}>
            <ul className={styles.choices}>
              {lifeChangeCodes.map((code) => {
                const date = dates.get(code)
                return (
                  <li key={code}>
                    <Link
                      className={styles.choice}
                      to={`/home/life-changes/${code}`}
                      onClick={() => dialog.current?.close()}
                    >
                      <span>
                        <strong>{t(`lifeChanges.types.${code}.title`)}</strong>
                        {date && (
                          <small>
                            {t('lifeChanges.registered', {
                              date: formatCalendarDate(date, i18n.language),
                            })}
                          </small>
                        )}
                      </span>
                      <span aria-hidden="true">›</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </QueryState>
        )}
      </dialog>
    </>
  )
}
