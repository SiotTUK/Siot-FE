import { adminMessages } from '@/features/admin/messages'
import { authMessages } from '@/features/auth/messages'
import { chatMessages } from '@/features/chat/messages'
import { checklistMessages } from '@/features/checklist/messages'
import { onboardingMessages } from '@/features/onboarding/messages'
import { homeMessages } from '@/pages/home/messages'
import { meMessages } from '@/pages/me/messages'
import { pageMessages } from '@/pages/messages'
import { registerMessages } from '@/shared/i18n'

// Each feature and page owns its text; this is the one place that loads it.
registerMessages(
  pageMessages,
  authMessages,
  onboardingMessages,
  checklistMessages,
  homeMessages,
  meMessages,
  chatMessages,
  adminMessages,
)
