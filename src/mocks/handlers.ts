import { adminHandlers } from './handlers/admin'
import { authHandlers } from './handlers/auth'
import { scheduleHandlers } from './handlers/schedules'
import { chatHandlers } from './handlers/chat'
import { checklistHandlers } from './handlers/checklist'
import { eventHandlers } from './handlers/events'
import { lifeChangeHandlers } from './handlers/life-changes'
import { memberHandlers } from './handlers/member'

export { mockResetToken, mockSignupCode, resetMockState } from './db'

/** Dev/test-only mock of the BE contract (Swagger). Never imported by production code. */
export const handlers = [
  ...authHandlers,
  ...memberHandlers,
  ...checklistHandlers,
  ...scheduleHandlers,
  ...eventHandlers,
  ...lifeChangeHandlers,
  ...chatHandlers,
  ...adminHandlers,
]
