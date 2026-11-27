import { useTranslation } from 'react-i18next'
import { chatEntryState } from '@/features/chat/chat-entry'
import { ButtonLink } from '@/shared/ui/button'
import { formatCalendarDate } from '@/shared/i18n/format'
import { KeepTogether } from '@/shared/ui/keep-together'
import { Muted, Notice } from '@/shared/ui/page'
import { rulesCheckedOn } from '../content'
import { safeUrl } from '../rules'
import { useRule } from '../use-rules'
import styles from './rules.module.css'

/** Rule detail (Figma M07a layout): title card, checked points, facts, sources. */
export function RuleDetail({ code }: { code: string }) {
  const { t, i18n } = useTranslation()
  const rule = useRule(code)
  if (!rule) return <Muted>{t('rules.notFound')}</Muted>

  return (
    <>
      <header className={styles.hero}>
        <p className={styles.heroMeta}>{t(`rules.groups.${rule.category}`)}</p>
        <h2>{rule.title}</h2>
        <p>
          <KeepTogether text={rule.summary} />
        </p>
      </header>

      {rule.points.length > 0 && (
        <section className={styles.panel} aria-label={t('rules.content')}>
          <ul className={styles.points}>
            {rule.points.map((point) => (
              <li key={point}>
                <KeepTogether text={point} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {rule.facts.length > 0 && (
        <dl className={`${styles.panel} ${styles.facts}`}>
          {rule.facts.map((fact) => (
            <div key={fact.key}>
              <dt>{t(`rules.facts.${fact.key}`)}</dt>
              <dd>
                <KeepTogether text={fact.value} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      <Notice tone="note" title={t('rules.source')}>
        <ul className={styles.sources}>
          {rule.sources.map((source) => {
            const url = safeUrl(source.url)
            return (
              <li key={source.url} lang="ko">
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {source.name}
                  </a>
                ) : (
                  source.name
                )}
              </li>
            )
          })}
        </ul>
        <p>
          {t('rules.checkedOn', {
            date: formatCalendarDate(rulesCheckedOn, i18n.language),
          })}
        </p>
      </Notice>

      {/* CB-06: the member edits the draft and sends it in the chat. */}
      <ButtonLink
        variant="secondary"
        className={styles.ask}
        to="/chat"
        state={chatEntryState(
          { type: 'rule', id: rule.code },
          t('rules.askDraft', { title: rule.title }),
        )}
      >
        {t('rules.ask')}
      </ButtonLink>
    </>
  )
}
