import { adminHandlers } from './handlers/admin'
import { authHandlers } from './handlers/auth'
import { chatHandlers } from './handlers/chat'
import { memberHandlers } from './handlers/member'

export { mockResetToken, mockSignupCode, resetMockState } from './db'

/** Dev/test-only mock of the BE contract (Swagger). Never imported by production code. */
export const handlers = [
  ...authHandlers,
  ...memberHandlers,
  ...chatHandlers,
  ...adminHandlers,
]
