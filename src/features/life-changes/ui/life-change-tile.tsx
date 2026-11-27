import { useTranslation } from 'react-i18next'
import { useChecklist } from '@/features/checklist/use-checklist'
import { currentLanguage } from '@/shared/i18n'
import { formatMonthDay } from '@/shared/i18n/format'
import { ActionTile } from '@/shared/ui/action-tile'
import { LifeChangeIcon } from '@/shared/ui/icons'
import { currentLifeChange } from '../life-changes'
import { useLifeChanges } from '../use-life-changes'

/**
 * Figma v2 home 생활 변화 card. It opens F06a (`/home/life-changes`); once a
 * change with open tasks is registered it shows "이사 진행 중 · 할 일 3개".
 */
export function LifeChangeTile({ memberId }: { memberId: number }) {
  const { t, i18n } = useTranslation()
  const changes = useLifeChanges(memberId)
  const checklist = useChecklist(memberId, currentLanguage())
  const current =
    changes.data &&
    checklist.data &&
    currentLifeChange(changes.data, checklist.data.items)
  const name = current && t(`checklist.lifeChangeTag.${current.code}`)

  return (
    <ActionTile
      to="/home/life-changes"
      icon={<LifeChangeIcon />}
      title={
        current?.openCount
          ? t('lifeChanges.inProgress', { name, count: current.openCount })
          : t('lifeChanges.pickerTitle')
      }
      description={
        current?.openCount
          ? t('lifeChanges.inProgressHint', {
              name,
              date: formatMonthDay(current.baseDate, i18n.language),
            })
          : t('lifeChanges.homeHint')
      }
    />
  )
}
