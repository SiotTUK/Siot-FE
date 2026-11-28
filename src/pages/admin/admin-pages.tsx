import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { DocumentList } from '@/features/admin/ui/document-list'
import { EventCreate, EventEdit } from '@/features/admin/ui/event-editor'
import { EventList } from '@/features/admin/ui/event-list'
import { GuideEditor } from '@/features/admin/ui/guide-editor'
import { MemberList } from '@/features/admin/ui/member-list'
import { ReviewList } from '@/features/admin/ui/review-list'
import { RuleCategoryList } from '@/features/admin/ui/rule-categories'
import { RuleCreate, RuleEdit } from '@/features/admin/ui/rule-editor'
import { RuleFaqList } from '@/features/admin/ui/rule-faqs'
import { RuleList } from '@/features/admin/ui/rule-list'
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
  ['rules', 'admin.menuRules', 'admin.menuRulesDesc'],
  ['events', 'admin.menuEvents', 'admin.menuEventsDesc'],
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

/** ADM-06 */
export function AdminRulesPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuRules')} backTo="/admin">
      <RuleList />
    </AdminScreen>
  )
}

/** RUL-09 */
export function AdminRuleNewPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.rules.create')} backTo="/admin/rules">
      <RuleCreate />
    </AdminScreen>
  )
}

/** RUL-10·11 */
export function AdminRuleEditPage() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const created = (useLocation().state as { created?: boolean } | null)?.created
  return (
    <AdminScreen title={t('admin.menuRules')} backTo="/admin/rules">
      <RuleEdit key={code} code={code} created={created} />
    </AdminScreen>
  )
}

/** RUL-12·13 */
export function AdminRuleCategoriesPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuRuleCategories')} backTo="/admin/rules">
      <RuleCategoryList />
    </AdminScreen>
  )
}

/** RUL-04 */
export function AdminRuleFaqsPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuRuleFaqs')} backTo="/admin/rules">
      <RuleFaqList />
    </AdminScreen>
  )
}

/** ADM-05 */
export function AdminEventsPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.menuEvents')} backTo="/admin">
      <EventList />
    </AdminScreen>
  )
}

/** EVE-07 */
export function AdminEventNewPage() {
  const { t } = useTranslation()
  return (
    <AdminScreen title={t('admin.events.create')} backTo="/admin/events">
      <EventCreate />
    </AdminScreen>
  )
}

/** EVE-08·09. ADM-07 (#39) links reported events here. */
export function AdminEventEditPage() {
  const { t } = useTranslation()
  const eventId = Number(useParams().eventId)
  const created = (useLocation().state as { created?: boolean } | null)?.created
  return (
    <AdminScreen title={t('admin.menuEvents')} backTo="/admin/events">
      <EventEdit key={eventId} eventId={eventId} created={created} />
    </AdminScreen>
  )
}
