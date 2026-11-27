import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './text-link.module.css'

/**
 * Figma v2 text link: the whole sentence is the link, in the brand color,
 * left-aligned ("처음이신가요? 회원가입", "이미 회원이에요? 로그인").
 */
export function TextLink({
  children,
  ...link
}: Omit<LinkProps, 'className'> & { children: ReactNode }) {
  return (
    <Link {...link} className={styles.link}>
      {children}
    </Link>
  )
}
