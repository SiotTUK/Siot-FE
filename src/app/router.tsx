import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestOnly, RequireMember } from '@/features/auth/route-guards'
import { billTranslationPath } from '@/features/bill-translation/bill-translation'
import {
  LoginPage,
  PasswordResetPage,
  PasswordResetRequestPage,
  SignupPage,
} from '@/pages/auth/auth-pages'
import { CalendarPage } from '@/pages/calendar/calendar-page'
import {
  ScheduleDetailPage,
  TaxDetailPage,
} from '@/pages/calendar/tax-detail-page'
import { EventDetailPage, EventsPage } from '@/pages/events/event-pages'
import { ChecklistDetailPage } from '@/pages/home/checklist-detail-page'
import { HomePage } from '@/pages/home/home-page'
import { LifeChangePage } from '@/pages/home/life-change-page'
import { LifeChangeSelectPage } from '@/pages/home/life-change-select-page'
import { LanguagePage } from '@/pages/language-page'
import { MeEditPage } from '@/pages/me/me-edit-page'
import { MePage } from '@/pages/me/me-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { NotificationsPage } from '@/pages/notifications/notifications-page'
import { OnboardingPage } from '@/pages/onboarding/onboarding-page'
import type { RouteTitleHandle } from '@/shared/lib/document-title'
import { deferredModule, type DeferredScreen } from './deferred-module'
import {
  AuthLayout,
  MainLayout,
  OnboardingLayout,
  RootLayout,
  TopBarLayout,
} from './layouts'
import { DeferredPage } from './route-feedback'

const adminScreen = deferredModule(() => import('@/pages/admin/admin-pages'))
const billScreen = deferredModule(
  () => import('@/pages/bill-translation/bill-pages'),
)
const chatScreen = deferredModule(() => import('@/pages/chat/chat-pages'))
const ruleScreen = deferredModule(() => import('@/pages/rules/rule-pages'))

function deferredPage<Page extends string>(
  screen: (page: Page) => DeferredScreen,
  page: NoInfer<Page>,
) {
  return <DeferredPage key={page} screen={screen(page)} />
}

const title = (titleKey: string): RouteTitleHandle => ({ titleKey })

/**
 * Logged out: language, signup, login and password reset only.
 * Logged in + onboarded=false: onboarding only. Onboarded: the rest.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        // F01 has the top bar; M02a–d have their own back header (Figma v2).
        element: <AuthLayout />,
        children: [
          {
            element: <GuestOnly />,
            children: [
              {
                element: <TopBarLayout />,
                children: [
                  {
                    path: '/',
                    element: <LanguagePage />,
                    handle: title('languagePage.title'),
                  },
                ],
              },
              {
                path: '/signup',
                element: <SignupPage />,
                handle: title('signup.title'),
              },
              {
                path: '/login',
                element: <LoginPage />,
                handle: title('login.title'),
              },
            ],
          },
          // Reachable from the reset mail regardless of session state.
          {
            path: '/password-reset/request',
            element: <PasswordResetRequestPage />,
            handle: title('resetRequest.title'),
          },
          {
            path: '/password-reset',
            element: <PasswordResetPage />,
            handle: title('newPassword.title'),
          },
        ],
      },
      {
        element: <RequireMember when="onboarding" />,
        children: [
          {
            path: '/onboarding',
            element: <OnboardingLayout />,
            children: [
              { index: true, element: <Navigate to="type" replace /> },
              {
                path: ':question',
                element: <OnboardingPage />,
                handle: title('onboarding.headers.userType'),
              },
            ],
          },
        ],
      },
      {
        element: <RequireMember when="onboarded" />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                path: '/home',
                element: <HomePage />,
                handle: title('nav.home'),
              },
              {
                path: '/calendar',
                element: <CalendarPage />,
                handle: title('nav.calendar'),
              },
              {
                path: '/events',
                element: <EventsPage />,
                handle: title('events.title'),
              },
              {
                path: '/rules',
                element: deferredPage(ruleScreen, 'RulesPage'),
                handle: title('nav.rules'),
              },
              {
                path: '/notifications',
                element: <NotificationsPage />,
                handle: title('notifications.title'),
              },
              {
                path: '/me',
                element: <MePage />,
                handle: title('nav.me'),
              },
            ],
          },
          {
            path: '/events/:eventId',
            element: <EventDetailPage />,
            handle: title('events.detail'),
          },
          {
            path: billTranslationPath,
            element: deferredPage(billScreen, 'BillUploadPage'),
            handle: title('bill.screenTitle'),
          },
          {
            path: `${billTranslationPath}/:id`,
            element: deferredPage(billScreen, 'BillResultPage'),
            handle: title('bill.result'),
          },
          {
            path: '/rules/faq',
            element: deferredPage(ruleScreen, 'RuleFaqPage'),
            handle: title('rules.faqTitle'),
          },
          {
            path: '/rules/category/:category',
            element: deferredPage(ruleScreen, 'RuleCategoryPage'),
            handle: title('nav.rules'),
          },
          {
            path: '/rules/:code',
            element: deferredPage(ruleScreen, 'RuleDetailPage'),
            handle: title('nav.rules'),
          },
          {
            path: '/home/life-changes',
            element: <LifeChangeSelectPage />,
            handle: title('lifeChanges.trigger'),
          },
          {
            path: '/home/checklist/:code',
            element: <ChecklistDetailPage />,
            handle: title('checklist.detail.screenTitle'),
          },
          {
            path: '/calendar/taxes/:scheduleId',
            element: <TaxDetailPage />,
            handle: title('calendar.tax.screenTitle'),
          },
          {
            path: '/calendar/schedules/:scheduleId',
            element: <ScheduleDetailPage />,
            handle: title('calendar.schedule.screenTitle'),
          },
          {
            path: '/home/life-changes/:code',
            element: <LifeChangePage />,
            handle: title('lifeChanges.trigger'),
          },
          {
            path: '/me/edit/:question',
            element: <MeEditPage />,
            handle: title('nav.me'),
          },
          // Chat is full screen with its own header (M08), no tab bar.
          {
            path: '/chat/history',
            element: deferredPage(chatScreen, 'ChatHistoryPage'),
            handle: title('chat.historyTitle'),
          },
          {
            path: '/chat/:conversationId?',
            element: deferredPage(chatScreen, 'ChatPage'),
            handle: title('chat.title'),
          },
        ],
      },
      {
        // ADM-01~08, CHK-06. The server still rejects non-admins with 403.
        path: '/admin',
        element: <RequireMember when="admin" />,
        handle: title('admin.title'),
        children: [
          {
            index: true,
            element: deferredPage(adminScreen, 'AdminHomePage'),
            handle: title('admin.title'),
          },
          {
            path: 'members',
            element: deferredPage(adminScreen, 'AdminMembersPage'),
            handle: title('admin.menuMembers'),
          },
          {
            path: 'reviews',
            element: deferredPage(adminScreen, 'AdminReviewsPage'),
            handle: title('admin.menuReviews'),
          },
          {
            path: 'guides',
            element: deferredPage(adminScreen, 'AdminGuidesPage'),
            handle: title('admin.menuGuides'),
          },
          {
            path: 'documents',
            element: deferredPage(adminScreen, 'AdminDocumentsPage'),
            handle: title('admin.menuDocuments'),
          },
          // ADM-06·RUL-04·09~13
          {
            path: 'rules',
            element: deferredPage(adminScreen, 'AdminRulesPage'),
            handle: title('admin.menuRules'),
          },
          {
            path: 'rules/new',
            element: deferredPage(adminScreen, 'AdminRuleNewPage'),
            handle: title('admin.rules.create'),
          },
          {
            path: 'rules/:code',
            element: deferredPage(adminScreen, 'AdminRuleEditPage'),
            handle: title('admin.menuRules'),
          },
          {
            path: 'rule-categories',
            element: deferredPage(adminScreen, 'AdminRuleCategoriesPage'),
            handle: title('admin.menuRuleCategories'),
          },
          {
            path: 'rule-faqs',
            element: deferredPage(adminScreen, 'AdminRuleFaqsPage'),
            handle: title('admin.menuRuleFaqs'),
          },
          // ADM-05·EVE-07~09
          {
            path: 'events',
            element: deferredPage(adminScreen, 'AdminEventsPage'),
            handle: title('admin.menuEvents'),
          },
          {
            path: 'events/new',
            element: deferredPage(adminScreen, 'AdminEventNewPage'),
            handle: title('admin.events.create'),
          },
          {
            path: 'events/:eventId',
            element: deferredPage(adminScreen, 'AdminEventEditPage'),
            handle: title('admin.menuEvents'),
          },
          // ADM-07
          {
            path: 'reports',
            element: deferredPage(adminScreen, 'AdminReportsPage'),
            handle: title('admin.menuReports'),
          },
          {
            path: 'reports/:reportId',
            element: deferredPage(adminScreen, 'AdminReportPage'),
            handle: title('admin.menuReports'),
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
        handle: title('notFound.title'),
      },
    ],
  },
])
