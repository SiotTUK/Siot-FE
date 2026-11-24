import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestOnly, RequireMember } from '@/features/auth/route-guards'
import {
  AdminGuidesPage,
  AdminHomePage,
  AdminMembersPage,
  AdminReviewsPage,
} from '@/pages/admin/admin-pages'
import {
  LoginPage,
  PasswordResetPage,
  PasswordResetRequestPage,
  SignupPage,
} from '@/pages/auth/auth-pages'
import { ChatHistoryPage, ChatPage } from '@/pages/chat/chat-pages'
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

/**
 * Logged out: language, signup, login and password reset only.
 * Logged in + onboarded=false: onboarding only. Onboarded: the rest.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
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
              { path: '/me', element: <MePage /> },
            ],
          },
          { path: '/home/life-changes/:code', element: <LifeChangePage /> },
          { path: '/me/edit/:question', element: <MeEditPage /> },
          // Chat is full screen with its own header (M08), no tab bar.
          { path: '/chat/history', element: <ChatHistoryPage /> },
          { path: '/chat/:conversationId?', element: <ChatPage /> },
        ],
      },
      {
        // ADM-01·08, CHK-06. The server still rejects non-admins with 403.
        path: '/admin',
        element: <RequireMember when="admin" />,
        children: [
          { index: true, element: <AdminHomePage /> },
          { path: 'members', element: <AdminMembersPage /> },
          { path: 'reviews', element: <AdminReviewsPage /> },
          { path: 'guides', element: <AdminGuidesPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
