import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestOnly, RequireMember } from '@/features/auth/route-guards'
import {
  LoginPage,
  PasswordResetPage,
  PasswordResetRequestPage,
  SignupPage,
} from '@/pages/auth/auth-pages'
import { HomePage } from '@/pages/home/home-page'
import { LanguagePage } from '@/pages/language-page'
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
            children: [{ path: '/home', element: <HomePage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
