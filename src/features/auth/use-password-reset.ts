import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { refreshCsrf } from '@/shared/api/client'
import {
  confirmPasswordReset,
  meQueryKey,
  validatePasswordResetToken,
} from './api'
import { rotateSessionScope } from './session-scope'

/** M02d link check. The token is a secret, so it stays out of the query key. */
export function usePasswordResetLink(token: string) {
  return useQuery({
    queryKey: ['password-reset-validation'],
    queryFn: () => validatePasswordResetToken(token),
    enabled: token !== '',
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnMount: 'always',
  })
}

/** On success every session of the member ends; go to login with a notice. */
export function useConfirmPasswordReset() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: async () => {
      rotateSessionScope(queryClient)
      queryClient.setQueryData(meQueryKey, null)
      await refreshCsrf().catch(() => undefined)
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    },
  })
}
