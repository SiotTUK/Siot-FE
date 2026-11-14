export interface ApiResponse<T> {
  data: T
}

export interface ErrorResponse {
  code: string
  message: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface MemberResponse {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
  language: string
  userType: 'NEW' | 'LIVING' | null
  emailVerified: boolean
  onboarded: boolean
}
