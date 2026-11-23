import { ApiError, apiRequest } from '@/shared/api/client'
import type { LifeChangeCode } from './life-changes'

export interface LifeChangeResponse {
  lifeChangeCode: LifeChangeCode
  baseDate: string
  createdAt: string
  updatedAt: string
}

const path = '/api/members/me/life-changes'

export const lifeChangeKeys = {
  all: ['life-changes'] as const,
  member: (memberId: number) => [...lifeChangeKeys.all, memberId] as const,
}

export function fetchLifeChanges(signal?: AbortSignal) {
  return apiRequest<LifeChangeResponse[]>(path, { signal })
}

export function saveLifeChange(
  code: LifeChangeCode,
  baseDate: string,
  isRequestCurrent: () => boolean,
) {
  return apiRequest<LifeChangeResponse>(`${path}/${code}`, {
    method: 'PUT',
    body: { baseDate },
    isRequestCurrent,
  })
}

export async function deleteLifeChange(
  code: LifeChangeCode,
  isRequestCurrent: () => boolean,
) {
  try {
    await apiRequest(`${path}/${code}`, {
      method: 'DELETE',
      isRequestCurrent,
    })
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 404 ||
      error.code !== 'LIFE_CHANGE_NOT_FOUND'
    )
      throw error
  }
}
