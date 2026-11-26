import type { ComponentType } from 'react'
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
import { OnboardingPage } from '@/pages/onboarding/onboarding-page'
import {
  MainLayout,
  OnboardingLayout,
  RootLayout,
  TopBarLayout,
} from './layouts'
import { InitialRouteLoading, RouteLoadFailure } from './route-feedback'

const loadAdminPages = () => import('@/pages/admin/admin-pages')
const loadChatPages = () => import('@/pages/chat/chat-pages')
const loadRulePages = () => import('@/pages/rules/rule-pages')

function lazyPage<Page extends string>(
  load: () => Promise<Record<Page, ComponentType>>,
  page: Page,
) {
  return {
    async lazy() {
      try {
        return { Component: (await load())[page] }
      } catch {
        // Resolve the route so its layout and guards can show the recovery UI.
        return { Component: RouteLoadFailure }
      }
    },
  }
}

/**
 * Logged out: language, signup, login and password reset only.
 * Logged in + onboarded=false: onboarding only. Onboarded: the rest.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    HydrateFallback: InitialRouteLoading,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: '/', element: <LanguagePage /> },
          {
            element: <TopBarLayout />,
            children: [
              { path: '/signup', element: <SignupPage /> },
              { path: '/login', element: <LoginPage /> },
            ],
          },
        ],
      },
      {
        // Reachable from the reset mail regardless of session state.
        element: <TopBarLayout />,
        children: [
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
              { path: '/rules', ...lazyPage(loadRulePages, 'RulesPage') },
              { path: '/me', element: <MePage /> },
            ],
          },
          { path: '/events/:eventId', element: <EventDetailPage /> },
          {
            path: '/rules/:code',
            ...lazyPage(loadRulePages, 'RuleDetailPage'),
          },
          { path: '/home/life-changes/:code', element: <LifeChangePage /> },
          { path: '/me/edit/:question', element: <MeEditPage /> },
          // Chat is full screen with its own header (M08), no tab bar.
          {
            path: '/chat/history',
            ...lazyPage(loadChatPages, 'ChatHistoryPage'),
          },
          {
            path: '/chat/:conversationId?',
            ...lazyPage(loadChatPages, 'ChatPage'),
          },
        ],
      },
      {
        // ADM-01·08, CHK-06. The server still rejects non-admins with 403.
        path: '/admin',
        element: <RequireMember when="admin" />,
        children: [
          { index: true, ...lazyPage(loadAdminPages, 'AdminHomePage') },
          { path: 'members', ...lazyPage(loadAdminPages, 'AdminMembersPage') },
          { path: 'reviews', ...lazyPage(loadAdminPages, 'AdminReviewsPage') },
          { path: 'guides', ...lazyPage(loadAdminPages, 'AdminGuidesPage') },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
