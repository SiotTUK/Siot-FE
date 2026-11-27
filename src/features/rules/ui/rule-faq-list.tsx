import { Link } from 'react-router-dom'
import styles from './rules.module.css'

/** How many questions M06 shows as "자주 묻는 질문 TOP 5". */
export const faqTopCount = 5

/**
 * Figma v2 M06 "자주 묻는 질문": one card, a numbered row per question that
 * opens the rule it answers (›). The full list (`/rules/faq`) also shows
 * each short answer under its question.
 */
export function RuleFaqList({
  faqs,
  withAnswers = false,
}: {
  faqs: { question: string; answer: string; rule: string }[]
  withAnswers?: boolean
}) {
  return (
    <ol className={styles.faqList}>
      {faqs.map((faq, index) => (
        <li key={faq.question}>
          <Link to={`/rules/${faq.rule}`} state={{ from: 'rules' }}>
            <span className={styles.rank} data-top={index < 3}>
              {index + 1}
            </span>
            <span className={styles.question}>
              {faq.question}
              {withAnswers && <small>{faq.answer}</small>}
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
