import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export interface RouteTitleHandle {
  titleKey: string
}

/**
 * Formats the browser document title (WCAG 2.4.2, #125):
 * "Screen · Brand" or "Item · Screen · Brand", omitting empty/duplicate parts.
 */
export function formatDocumentTitle(
  brand: string,
  ...parts: (string | null | undefined)[]
) {
  const cleanBrand = brand.trim()
  const segments: string[] = []
  for (const part of parts) {
    const trimmed = part?.trim()
    if (!trimmed) continue
    if (trimmed === cleanBrand || segments.includes(trimmed)) continue
    segments.push(trimmed)
  }
  if (cleanBrand) segments.push(cleanBrand)
  return segments.join(' · ')
}

/** Extracts the deepest route's `handle.titleKey` from React Router matches. */
export function routeTitleKey(
  matches: readonly { handle?: unknown }[],
): string | undefined {
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i]?.handle
    if (
      handle &&
      typeof handle === 'object' &&
      'titleKey' in handle &&
      typeof (handle as RouteTitleHandle).titleKey === 'string'
    ) {
      return (handle as RouteTitleHandle).titleKey
    }
  }
  return undefined
}

/**
 * Sets `document.title` for detail/dynamic screens. Runs in `useEffect` (after
 * RootLayout's `useLayoutEffect` route default), so loaded item titles always
 * win and loading/error states fall back cleanly to the screen title.
 */
export function useDocumentTitle(...parts: (string | null | undefined)[]) {
  const { t, i18n } = useTranslation()
  const title = formatDocumentTitle(t('common.brand'), ...parts)
  useEffect(() => {
    document.title = title
  }, [title, i18n.language])
}
