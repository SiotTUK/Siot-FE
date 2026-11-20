import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useChangeLanguage } from '@/features/auth/use-session'
import { currentLanguage } from '@/shared/i18n'
import { LanguageSelect } from '@/shared/ui/language-select'
import styles from './chat.module.css'

/** M08 header: ‹ back, title, language, then page actions (기록 · 새 대화). */
export function ChatHeader({
  title,
  backTo,
  backLabel,
  children,
}: {
  title: string
  backTo: string
  backLabel: string
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const changeLanguage = useChangeLanguage()
  return (
    <header className={styles.header}>
      <Link className={styles.back} to={backTo} aria-label={backLabel}>
        <span aria-hidden="true">‹</span>
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.actions}>
        <LanguageSelect
          label={t('common.language')}
          value={currentLanguage()}
          onChange={changeLanguage}
        />
        {children}
      </div>
    </header>
  )
}
