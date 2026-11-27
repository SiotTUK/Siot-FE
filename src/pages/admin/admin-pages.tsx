import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DocumentList } from '@/features/admin/ui/document-list'
import { GuideEditor } from '@/features/admin/ui/guide-editor'
import { MemberList } from '@/features/admin/ui/member-list'
import { ReviewList } from '@/features/admin/ui/review-list'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Card, Muted, Stack } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'

/** Admin screens: ‹ back + title, then the content. */
function AdminScreen({
  title,
  backTo,
  children,
}: {
  title: string
  backTo: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <>
      <ScreenHeader
        back={{ label: t('common.back'), to: backTo }}
        title={title}
      />
      <PageBody>
        <Stack gap={16}>{children}</Stack>
      </PageBody>
    </>
  )
}

const menus = [
  ['members', 'admin.menuMembers', 'admin.menuMembersDesc'],
  ['reviews', 'admin.menuReviews', 'admin.menuReviewsDesc'],
  ['guides', 'admin.menuGuides', 'admin.menuGuidesDesc'],
  ['documents', 'admin.menuDocuments', 'admin.menuDocumentsDesc'],
] as const

export function AdminHomePage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.title')} backTo="/me">
      {menus.map(([path, title, description]) => (
        <Link key={path} className="plain-link" to={`/admin/${path}`}>
          <Card>
            <strong>{t(title)}</strong>
            <Muted>{t(description)}</Muted>
          </Card>
        </Link>
      ))}
    </AdminScreen>
  )
}

/** ADM-01 */
export function AdminMembersPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuMembers')} backTo="/admin">
      <MemberList />
    </AdminScreen>
  )
}

/** ADM-08 */
export function AdminReviewsPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuReviews')} backTo="/admin">
      <ReviewList />
    </AdminScreen>
  )
}

/** CHK-06 */
export function AdminGuidesPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuGuides')} backTo="/admin">
      <GuideEditor />
    </AdminScreen>
  )
}

/** ADM-02~04, NTF-06 */
export function AdminDocumentsPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuDocuments')} backTo="/admin">
      <DocumentList />
    </AdminScreen>
  )
}
