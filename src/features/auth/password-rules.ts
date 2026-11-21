import { z } from 'zod'

/**
 * Client-side mirror of the BE password policy for instant feedback.
 * The server still validates and its error wins.
 */
export const passwordRuleKeys = [
  'length',
  'letterAndDigit',
  'allowedCharacters',
  'noWhitespace',
  'notEmail',
] as const
export type PasswordRule = (typeof passwordRuleKeys)[number]

export function checkPasswordRules(
  password: string,
  email?: string,
): Record<PasswordRule, boolean> {
  const normalizedEmail = email?.trim().toLowerCase() ?? ''
  return {
    length: password.length >= 8 && password.length <= 64,
    letterAndDigit: /[A-Za-z]/.test(password) && /\d/.test(password),
    // M-03: letters, digits and special characters only (printable ASCII like the BE).
    // Whitespace has its own rule, so it does not break this one.
    allowedCharacters: password.length > 0 && /^[\x21-\x7E\s]*$/.test(password),
    noWhitespace: password.length > 0 && !/\s/.test(password),
    notEmail:
      password.length > 0 &&
      (normalizedEmail === '' || password.toLowerCase() !== normalizedEmail),
  }
}

const ruleErrorKey: Record<PasswordRule, string> = {
  length: 'errors.PASSWORD_LENGTH',
  letterAndDigit: 'errors.PASSWORD_LETTER_AND_DIGIT_REQUIRED',
  allowedCharacters: 'errors.PASSWORD_INVALID_CHARACTER',
  noWhitespace: 'errors.PASSWORD_WHITESPACE',
  notEmail: 'errors.PASSWORD_SAME_AS_EMAIL',
}

/** i18n key of the first broken rule, matching the BE "first violation only" order. */
export function firstPasswordError(
  password: string,
  email?: string,
): string | undefined {
  if (!password) return 'validation.passwordRequired'
  const result = checkPasswordRules(password, email)
  const order: PasswordRule[] = [
    'length',
    'noWhitespace',
    'allowedCharacters',
    'letterAndDigit',
    'notEmail',
  ]
  const broken = order.find((rule) => !result[rule])
  return broken && ruleErrorKey[broken]
}

/** Same pattern as the BE CredentialPolicy (also used by the mock). */
export const emailPattern =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

/** Zod messages are i18n keys; screens translate them with t(). */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'validation.emailRequired')
  .max(255, 'errors.EMAIL_FORMAT')
  .regex(emailPattern, 'errors.EMAIL_FORMAT')

export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'validation.codeFormat')

/** Adds password-rule and confirm-match issues to an object schema. */
export function refinePasswordPair(
  value: { password: string; passwordConfirm: string; email?: string },
  ctx: z.RefinementCtx,
) {
  const error = firstPasswordError(value.password, value.email)
  if (error)
    ctx.addIssue({ code: 'custom', path: ['password'], message: error })
  if (value.password !== value.passwordConfirm)
    ctx.addIssue({
      code: 'custom',
      path: ['passwordConfirm'],
      message: 'errors.PASSWORD_CONFIRM_MISMATCH',
    })
}

/** Which form field a server error code belongs to. */
export function fieldForErrorCode(
  code: string,
): 'email' | 'code' | 'password' | 'passwordConfirm' | undefined {
  if (code === 'EMAIL_FORMAT' || code === 'DUPLICATE_EMAIL') return 'email'
  if (code === 'EMAIL_NOT_VERIFIED' || code.startsWith('EMAIL_VERIFICATION_'))
    return 'code'
  if (code === 'PASSWORD_CONFIRM_MISMATCH') return 'passwordConfirm'
  if (code.startsWith('PASSWORD_') && !code.startsWith('PASSWORD_RESET_'))
    return 'password'
  return undefined
}
