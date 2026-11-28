import { adminHandlers } from './handlers/admin'
import { adminEventHandlers } from './handlers/admin-events'
import { adminReportHandlers } from './handlers/admin-reports'
import { adminRuleHandlers } from './handlers/admin-rules'
import { authHandlers } from './handlers/auth'
import { billHandlers } from './handlers/bills'
import { scheduleHandlers } from './handlers/schedules'
import { chatHandlers } from './handlers/chat'
import { checklistHandlers } from './handlers/checklist'
import { documentHandlers } from './handlers/documents'
import { eventHandlers } from './handlers/events'
import { lifeChangeHandlers } from './handlers/life-changes'
import { memberHandlers } from './handlers/member'
import { notificationHandlers } from './handlers/notifications'
import { ruleHandlers } from './handlers/rules'

export { mockResetToken, mockSignupCode, resetMockState } from './db'

/** Dev/test-only mock of the BE contract (Swagger). Never imported by production code. */
export const handlers = [
  ...authHandlers,
  ...memberHandlers,
  ...billHandlers,
  ...checklistHandlers,
  ...scheduleHandlers,
  ...eventHandlers,
  ...lifeChangeHandlers,
  ...notificationHandlers,
  ...ruleHandlers,
  ...chatHandlers,
  ...adminHandlers,
  ...adminRuleHandlers,
  ...adminEventHandlers,
  ...adminReportHandlers,
  ...documentHandlers,
]
