import { Link } from 'react-router-dom'
import styles from './rules.module.css'

/**
 * Figma v2 M06 "자주 묻는 질문 TOP 5": one card, a numbered row per
 * question that opens the rule it answers (›).
 */
export function RuleFaqList({
  faqs,
}: {
  faqs: { question: string; rule: string }[]
}) {
  return (
    <ol className={styles.faqList}>
      {faqs.map((faq, index) => (
        <li key={faq.question}>
          <Link to={`/rules/${faq.rule}`} state={{ from: 'rules' }}>
            <span className={styles.rank} data-top={index < 3}>
              {index + 1}
            </span>
            <span className={styles.question}>{faq.question}</span>
            <span aria-hidden="true">›</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
