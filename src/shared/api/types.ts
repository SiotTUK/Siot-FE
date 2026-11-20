export interface ApiResponse<T> {
  data: T
}

export interface ErrorResponse {
  code: string
  message: string
  /** Only some errors include it, e.g. LOGIN_FAILED attempts. */
  details?: Record<string, unknown>
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export type Language = 'ko' | 'en' | 'zh' | 'vi'
export type UserType = 'NEW' | 'LIVING'
export type StayPurpose = 'STUDY' | 'WORK' | 'FAMILY' | 'OTHER'
export type Residence = 'KIDS' | 'CAR' | 'HOUSE' | 'KOREAN' | 'F4'

export interface MemberResponse {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
  language: Language
  /** null before onboarding. */
  userType: UserType | null
  /** YYYY-MM-DD, null when skipped. */
  entryDate: string | null
  /** null when skipped. The BE treats it as OTHER. */
  purpose: StayPurpose | null
  residences: Residence[]
  /** YYYY-MM-DD, null when skipped. */
  stayExpiry: string | null
  emailVerified: boolean
  onboarded: boolean
}
