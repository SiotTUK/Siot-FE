import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useChecklist } from '@/features/checklist/use-checklist'
import { currentLanguage } from '@/shared/i18n'
import { formatMonthDay } from '@/shared/i18n/format'
import { ChevronRightIcon, HouseArrowIcon } from '@/shared/ui/icons'
import { relatedLifeChangeTasks } from '../life-changes'
import { useLifeChanges } from '../use-life-changes'
import styles from './life-changes.module.css'

/**
 * Home card for life changes (Figma v2 H1). With a registered change that
 * still has open tasks: "이사 진행 중 · 할 일 3개" and it opens F06b.
 * Otherwise "요즘 무슨 일이 있나요?" opens F06a.
 */
export function LifeChangeCard({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const changes = useLifeChanges(memberId)
  const checklist = useChecklist(memberId, language)
  const active = [...(changes.data ?? [])]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((change) => ({
      change,
      open: relatedLifeChangeTasks(
        checklist.data?.items ?? [],
        change.lifeChangeCode,
        change.baseDate,
      ).filter((item) => item.status === 'TODO' || item.status === 'OVERDUE')
        .length,
    }))
    .find(({ open }) => open > 0)

  const name =
    active && t(`checklist.lifeChangeTag.${active.change.lifeChangeCode}`)
  return (
    <Link
      className={styles.card}
      to={
        active
          ? `/home/life-changes/${active.change.lifeChangeCode}`
          : '/home/life-changes'
      }
    >
      <span className={styles.cardIcon}>
        <HouseArrowIcon />
      </span>
      <span className={styles.cardText}>
        <strong>
          {active
            ? t('lifeChanges.active', { name, count: active.open })
            : t('lifeChanges.cardTitle')}
        </strong>
        <small>
          {active
            ? t('lifeChanges.activeHint', {
                name,
                date: formatMonthDay(active.change.baseDate, language),
              })
            : t('lifeChanges.cardHint')}
        </small>
      </span>
      <ChevronRightIcon />
    </Link>
  )
}
