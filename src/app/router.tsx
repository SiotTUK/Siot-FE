import { createBrowserRouter, Navigate } from 'react-router-dom'
import {
  GuestOnly,
  RequireAdmin,
  RequireMember,
} from '@/features/auth/route-guards'
import { AdminGuidesPage } from '@/pages/admin/admin-guides-page'
import { AdminHomePage } from '@/pages/admin/admin-home-page'
import { AdminMembersPage } from '@/pages/admin/admin-members-page'
import { AdminReviewsPage } from '@/pages/admin/admin-reviews-page'
import { LoginPage } from '@/pages/auth/login-page'
import { PasswordResetPage } from '@/pages/auth/password-reset-page'
import { PasswordResetRequestPage } from '@/pages/auth/password-reset-request-page'
import { SignupPage } from '@/pages/auth/signup-page'
import { ChatHistoryPage } from '@/pages/chat/chat-history-page'
import { ChatPage } from '@/pages/chat/chat-page'
import { HomePage } from '@/pages/home/home-page'
import { LanguagePage } from '@/pages/language-page'
import { MeEditPage } from '@/pages/me/me-edit-page'
import { MePage } from '@/pages/me/me-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { EntryDatePage } from '@/pages/onboarding/entry-date-page'
import { PurposePage } from '@/pages/onboarding/purpose-page'
import { ResidencePage } from '@/pages/onboarding/residence-page'
import { StayExpiryPage } from '@/pages/onboarding/stay-expiry-page'
import { UserTypePage } from '@/pages/onboarding/user-type-page'
import {
  MainLayout,
  OnboardingLayout,
  RootLayout,
  TopBarLayout,
} from './layouts'

/**
 * Logged out: only language, signup, login and password reset.
 * Logged in + onboarded=false: onboarding only. Onboarded: /home.
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
        element: <RequireMember onboarded={false} />,
        children: [
          {
            path: '/onboarding',
            element: <OnboardingLayout />,
            children: [
              { index: true, element: <Navigate to="type" replace /> },
              { path: 'type', element: <UserTypePage /> },
              { path: 'entry-date', element: <EntryDatePage /> },
              { path: 'purpose', element: <PurposePage /> },
              { path: 'residence', element: <ResidencePage /> },
              { path: 'stay-expiry', element: <StayExpiryPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireMember onboarded />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: '/home', element: <HomePage /> },
              { path: '/me', element: <MePage /> },
            ],
          },
          // Chat is full screen with its own header (M08), no tab bar.
          { path: '/me/edit/:field', element: <MeEditPage /> },
          { path: '/chat/history', element: <ChatHistoryPage /> },
          { path: '/chat/:conversationId?', element: <ChatPage /> },
        ],
      },
      {
        // ADM-01·08, CHK-06. The server still rejects non-admins with 403.
        path: '/admin',
        element: <RequireAdmin />,
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
