import { z } from 'zod'

/**
 * Login and withdrawal check a password the member already has, so they
 * mirror only the BE request checks (LoginRequest, WithdrawalRequest):
 * @NotBlank, password @Size(max = 64), email @Size(max = 255). Without them
 * the BE answers a plain INVALID_INPUT before it ever compares the password.
 */
export const passwordMaxLength = 64
export const emailMaxLength = 255

/**
 * Blank (empty or spaces only) asks for the password. Longer than 64 can
 * never match, because signup only allows 8–64 characters, so it gets the
 * same message a wrong password would.
 */
function currentPassword(tooLongKey: string) {
  return z.string().superRefine((value, ctx) => {
    if (value.trim() === '')
      ctx.addIssue({ code: 'custom', message: 'validation.passwordRequired' })
    else if (value.length > passwordMaxLength)
      ctx.addIssue({ code: 'custom', message: tooLongKey })
  })
}

/** M02a. An email over 255 characters cannot be an account either. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'validation.emailRequired')
    .max(emailMaxLength, 'errors.LOGIN_FAILED'),
  password: currentPassword('errors.LOGIN_FAILED'),
})

/** M-06. */
export const withdrawalSchema = z.object({
  password: currentPassword('errors.PASSWORD_INCORRECT'),
})
