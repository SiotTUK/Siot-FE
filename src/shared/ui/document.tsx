import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageLoader } from './mobile-frame'
import { Card, Muted, Notice } from './page'
import styles from './document.module.css'

export function AttachmentItem({
  name,
  children,
}: {
  name: string
  children?: ReactNode
}) {
  return (
    <Card>
      <p className={styles.name}>{name}</p>
      {children}
    </Card>
  )
}

export function DocumentItem({
  title,
  titleLanguage,
  to,
  children,
  action,
}: {
  title: string
  titleLanguage?: string
  to: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <Card as="li">
      <div className={styles.item}>
        <Link className={styles.name} to={to} lang={titleLanguage}>
          {title}
        </Link>
        {action}
      </div>
      {children}
    </Card>
  )
}

export function DocumentStatus({
  tone,
  label,
  children,
}: {
  tone: 'empty' | 'loading' | 'error' | 'success'
  label: string
  children?: ReactNode
}) {
  if (tone === 'loading') return <PageLoader label={label} />
  if (tone === 'empty') return <Muted>{label}</Muted>
  return (
    <Notice tone={tone === 'error' ? 'danger' : 'success'} title={label}>
      {children}
    </Notice>
  )
}
