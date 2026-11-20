import type { Language } from '../api/types'

type DeepStrings<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]>
}

export type Messages<T = object> = { ko: T } & Record<
  Exclude<Language, 'ko'>,
  DeepStrings<T>
>

/** Every language must have the same keys as Korean (checked by type). */
export function defineMessages<T extends object>(messages: Messages<T>) {
  return messages
}

/**
 * Korean-only text for internal screens (admin). Other languages fall back
 * to Korean through `fallbackLng`.
 */
export function defineKoreanMessages<T extends object>(
  ko: T,
): Partial<Messages<T>> {
  return { ko }
}
