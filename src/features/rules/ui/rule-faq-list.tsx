import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { KeepTogether } from '@/shared/ui/keep-together'
import styles from './rules.module.css'

/**
 * 자주 묻는 질문 TOP 5: one bordered card, a "Q." row per question that
 * opens its answer. Native <details> keeps keyboard support.
 */
export function RuleFaqList({
  faqs,
}: {
  faqs: { question: string; answer: string; rule: string }[]
}) {
  const { t } = useTranslation()
  return (
    <div className={styles.faqList}>
      {faqs.map((faq, index) => (
        <details key={faq.question} className={styles.faq} open={index === 0}>
          <summary>
            <span>
              <span aria-hidden="true">Q. </span>
              {faq.question}
            </span>
            <span className={styles.triangle} aria-hidden="true" />
          </summary>
          <p>
            <KeepTogether text={faq.answer} />
          </p>
          <Link to={`/rules/${faq.rule}`}>{t('rules.more')}</Link>
        </details>
      ))}
    </div>
  )
}
