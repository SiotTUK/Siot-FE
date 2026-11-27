import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import { detailBackPath, nextMark } from '@/features/checklist/checklist'
import { ChecklistDetail } from '@/features/checklist/ui/checklist-detail'
import {
  useChecklistItem,
  useMarkChecklistItem,
} from '@/features/checklist/use-checklist'
import { currentLanguage } from '@/shared/i18n'
import { PageBody, PageLoader } from '@/shared/ui/mobile-frame'
import { Muted } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'

export function ChecklistDetailPage() {
  const { t } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const back = detailBackPath(useLocation().state)
  const { data: me } = useMe()
  const language = currentLanguage()
  const memberId = me?.id ?? 0

  const query = useChecklistItem(memberId, language, code)
  const mark = useMarkChecklistItem(memberId, language)

  if (query.isPending && !query.data) {
    return <PageLoader label={t('common.loading')} />
  }

  if (query.notFound || !query.item) {
    return (
      <>
        <ScreenHeader
          back={{ label: t('common.back'), to: back }}
          title={t('checklist.detail.screenTitle')}
        />
        <PageBody>
          <Muted>{t('checklist.detail.notFound')}</Muted>
        </PageBody>
      </>
    )
  }

  return (
    <ChecklistDetail
      item={query.item}
      memberId={memberId}
      busy={mark.isPending}
      onToggleDone={() =>
        mark.mutate({
          item: query.item!,
          mark: nextMark(query.item!, 'toggleDone'),
        })
      }
    />
  )
}
