import { authMessages } from '@/features/auth/messages'
import { homeMessages } from '@/pages/home/messages'
import { onboardingMessages } from '@/features/onboarding/messages'
import { pageMessages } from '@/pages/messages'
import { registerMessages } from '@/shared/i18n'

// Each feature and page owns its text; this is the one place that loads it.
registerMessages(pageMessages, authMessages, onboardingMessages, homeMessages)
