import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestOnly, RequireMember } from '@/features/auth/route-guards'
import {
  LoginPage,
  PasswordResetPage,
  PasswordResetRequestPage,
  SignupPage,
} from '@/pages/auth/auth-pages'
import { CalendarPage } from '@/pages/calendar/calendar-page'
import { EventDetailPage, EventsPage } from '@/pages/events/event-pages'
import { HomePage } from '@/pages/home/home-page'
import { LifeChangePage } from '@/pages/home/life-change-page'
import { LanguagePage } from '@/pages/language-page'
import { MeEditPage } from '@/pages/me/me-edit-page'
import { MePage } from '@/pages/me/me-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { NotificationsPage } from '@/pages/notifications/notifications-page'
import { OnboardingPage } from '@/pages/onboarding/onboarding-page'
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
const chatScreen = deferredModule(() => import('@/pages/chat/chat-pages'))
const ruleScreen = deferredModule(() => import('@/pages/rules/rule-pages'))

function deferredPage<Page extends string>(
  screen: (page: Page) => DeferredScreen,
  page: NoInfer<Page>,
) {
  return <DeferredPage key={page} screen={screen(page)} />
}

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
                children: [{ path: '/', element: <LanguagePage /> }],
              },
              { path: '/signup', element: <SignupPage /> },
              { path: '/login', element: <LoginPage /> },
            ],
          },
          // Reachable from the reset mail regardless of session state.
          {
            path: '/password-reset/request',
            element: <PasswordResetRequestPage />,
          },
          { path: '/password-reset', element: <PasswordResetPage /> },
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
              { path: ':question', element: <OnboardingPage /> },
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
              { path: '/home', element: <HomePage /> },
              { path: '/calendar', element: <CalendarPage /> },
              { path: '/events', element: <EventsPage /> },
              {
                path: '/rules',
                element: deferredPage(ruleScreen, 'RulesPage'),
              },
              { path: '/notifications', element: <NotificationsPage /> },
              { path: '/me', element: <MePage /> },
            ],
          },
          { path: '/events/:eventId', element: <EventDetailPage /> },
          {
            path: '/rules/faq',
            element: deferredPage(ruleScreen, 'RuleFaqPage'),
          },
          {
            path: '/rules/category/:category',
            element: deferredPage(ruleScreen, 'RuleCategoryPage'),
          },
          {
            path: '/rules/:code',
            element: deferredPage(ruleScreen, 'RuleDetailPage'),
          },
          { path: '/home/life-changes/:code', element: <LifeChangePage /> },
          { path: '/me/edit/:question', element: <MeEditPage /> },
          // Chat is full screen with its own header (M08), no tab bar.
          {
            path: '/chat/history',
            element: deferredPage(chatScreen, 'ChatHistoryPage'),
          },
          {
            path: '/chat/:conversationId?',
            element: deferredPage(chatScreen, 'ChatPage'),
          },
        ],
      },
      {
        // ADM-01·08, CHK-06. The server still rejects non-admins with 403.
        path: '/admin',
        element: <RequireMember when="admin" />,
        children: [
          { index: true, element: deferredPage(adminScreen, 'AdminHomePage') },
          {
            path: 'members',
            element: deferredPage(adminScreen, 'AdminMembersPage'),
          },
          {
            path: 'reviews',
            element: deferredPage(adminScreen, 'AdminReviewsPage'),
          },
          {
            path: 'guides',
            element: deferredPage(adminScreen, 'AdminGuidesPage'),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
