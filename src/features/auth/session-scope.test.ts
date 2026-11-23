import { QueryClient } from '@tanstack/react-query'
import { expect, it } from 'vitest'
import { meQueryKey } from './api'
import { captureSessionScope, rotateSessionScope } from './session-scope'

it('keeps the scope across profile writes and replaces it across logins', () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(meQueryKey, { id: 1, purpose: 'WORK' })
  const isSessionCurrent = captureSessionScope(queryClient, 1)

  queryClient.setQueryData(meQueryKey, { id: 1, purpose: 'STUDY' })
  expect(isSessionCurrent()).toBe(true)

  queryClient.setQueryData(meQueryKey, null)
  expect(isSessionCurrent()).toBe(false)
  rotateSessionScope(queryClient)
  queryClient.setQueryData(meQueryKey, { id: 1, purpose: 'STUDY' })
  expect(isSessionCurrent()).toBe(false)
  expect(captureSessionScope(queryClient, 1)()).toBe(true)
})
