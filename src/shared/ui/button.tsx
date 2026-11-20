import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './button.module.css'

/** primary/danger = full-width action, secondary = outlined inline action, text = plain link-like. */
type Variant = 'primary' | 'secondary' | 'danger' | 'text'

const classes = (variant: Variant, className?: string) =>
  `${styles.button} ${styles[variant]} ${className ?? ''}`.trim()

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes(variant, className)}
    />
  )
}

/** A router link that looks like a button. */
export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link {...props} className={classes(variant, className)} />
}
