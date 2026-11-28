import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { busyButtonProps, guardBusyClick } from './button-guard'
import styles from './button.module.css'

/**
 * primary/danger = full-width action, secondary = light-blue inline action,
 * text = plain link-like. `block` makes secondary a full-width 52px button.
 */
type Variant = 'primary' | 'secondary' | 'danger' | 'text'

const classes = (variant: Variant, className?: string, block?: boolean) =>
  [styles.button, styles[variant], block && styles.block, className]
    .filter(Boolean)
    .join(' ')

export function Button({
  variant = 'primary',
  loading = false,
  block,
  disabled,
  className,
  type = 'button',
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  block?: boolean
}) {
  return (
    <button
      {...props}
      type={type}
      {...busyButtonProps({ disabled, loading })}
      onClick={guardBusyClick(Boolean(disabled || loading), onClick)}
      className={classes(variant, className, block)}
    />
  )
}

/** A router link that looks like a button. */
export function ButtonLink({
  variant = 'primary',
  className,
  block,
  ...props
}: LinkProps & { variant?: Variant; block?: boolean }) {
  return <Link {...props} className={classes(variant, className, block)} />
}
