import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/features/auth/use-session'
import { chatEntryState } from '@/features/chat/chat-entry'
import { formatCalendarDate } from '@/shared/i18n/format'
import { Button, ButtonLink } from '@/shared/ui/button'
import { KeepTogether } from '@/shared/ui/keep-together'
import { Muted, Section, Tag } from '@/shared/ui/page'
import { rulesCheckedOn } from '../content'
import { parseContacts, safeUrl, type Rule } from '../rules'
import { useRule } from '../use-rules'
import { RuleReport } from './rule-report'
import styles from './rules.module.css'

/** Facts shown as small cards under "알아 두세요"; law and contact have their own blocks. */
const knowKeys = ['when', 'where', 'fee', 'penalty'] as const

/**
 * Figma v2 "생활 수칙 · 상세" from the FE content: tags, title and summary,
 * "이렇게 하세요" (the checked statements, numbered), "알아 두세요" (when ·
 * where · cost · penalty), contacts with a call button, law and sources, and
 * the bottom buttons 정보 오류 신고 · 토로에게 질문하기.
 */
export function RuleDetail({ code }: { code: string }) {
  const { t } = useTranslation()
  const rule = useRule(code)
  if (!rule) return <Muted>{t('rules.notFound')}</Muted>
  return <RuleDetailBody rule={rule} />
}

function RuleDetailBody({ rule }: { rule: Rule }) {
  const { t, i18n } = useTranslation()
  const { data: me } = useMe()
  const reportId = useId()
  const [reporting, setReporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const fact = (key: string) => rule.facts.find((item) => item.key === key)
  const know = knowKeys.flatMap((key) => {
    const item = fact(key)
    return item ? [item] : []
  })
  const contact = fact('contact')
  const contacts = contact ? parseContacts(contact.value) : []
  const law = fact('law')

  useEffect(() => {
    if (reporting)
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [reporting])

  return (
    <>
      <div className={styles.detailHead}>
        <span className={styles.tags}>
          <Tag tone="main">{t(`rules.groups.${rule.category}`)}</Tag>
          {rule.fine && <Tag tone="danger">{t('rules.fineTag')}</Tag>}
        </span>
        <h2 className={styles.detailTitle}>{rule.title}</h2>
        <p className={styles.detailSummary}>
          <KeepTogether text={rule.summary} />
        </p>
      </div>

      {rule.points.length > 0 && (
        <Section title={t('rules.steps')}>
          <ol className={styles.steps}>
            {rule.points.map((point, index) => (
              <li key={point}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <span>
                  <KeepTogether text={point} />
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {know.length > 0 && (
        <Section title={t('rules.knowThis')}>
          <dl className={styles.know}>
            {know.map((item) => (
              <div key={item.key} data-key={item.key}>
                <dt>{t(`rules.facts.${item.key}`)}</dt>
                <dd>
                  <KeepTogether text={item.value} />
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {contacts.length > 0
        ? contacts.map((item) => (
            <div key={item.tel} className={styles.contact}>
              <p>
                <strong>{item.name || item.phone}</strong>
                <small>
                  {[item.name ? item.phone : '', item.note]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </p>
              <ButtonLink variant="secondary" to={`tel:${item.tel}`}>
                {t('rules.call')}
              </ButtonLink>
            </div>
          ))
        : contact && (
            <div className={styles.contact}>
              <p>
                <strong>{t('rules.facts.contact')}</strong>
                <small>{contact.value}</small>
              </p>
            </div>
          )}

      <div className={styles.refs}>
        {law && (
          <div className={styles.ref}>
            <small>{t('rules.facts.law')}</small>
            <strong>{law.value}</strong>
          </div>
        )}
        <details className={styles.ref}>
          <summary>
            <small>
              {t('rules.sourcesCount', { count: rule.sources.length })}
            </small>
            <strong>
              {t('rules.checkedOn', {
                date: formatCalendarDate(rulesCheckedOn, i18n.language),
              })}
            </strong>
          </summary>
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
        </details>
      </div>

      {reporting && me && (
        <div ref={reportRef}>
          <Section title={t('rules.report.open')}>
            <RuleReport rule={rule} memberId={me.id} id={reportId} />
          </Section>
        </div>
      )}

      <div className={styles.bottomBar}>
        <Button
          variant="secondary"
          aria-expanded={reporting}
          aria-controls={reporting ? reportId : undefined}
          onClick={() => setReporting(!reporting)}
        >
          {reporting ? t('common.cancel') : t('rules.report.open')}
        </Button>
        {/* CB-06: opens the chat with a draft the member edits and sends. */}
        <ButtonLink
          to="/chat"
          state={chatEntryState(
            { type: 'rule', id: rule.code },
            t('rules.askDraft', { title: rule.title }),
          )}
        >
          {t('rules.askToro')}
        </ButtonLink>
      </div>
    </>
  )
}
