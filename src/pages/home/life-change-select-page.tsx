import { useMe } from '@/features/auth/use-session'
import { LifeChangeSelect } from '@/features/life-changes/ui/life-change-select'

/** F06a 생활 변화 등록 (`/home/life-changes`). */
export function LifeChangeSelectPage() {
  const { data: me } = useMe()
  return me ? <LifeChangeSelect key={me.id} memberId={me.id} /> : null
}
