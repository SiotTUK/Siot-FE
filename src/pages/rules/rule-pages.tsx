import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ruleCategories } from '@/features/rules/rules'
import { useRule, useRuleFaqs } from '@/features/rules/use-rules'
import { RuleCategoryView } from '@/features/rules/ui/rule-category-view'
import { RuleDetail } from '@/features/rules/ui/rule-detail'
import { RuleFaqList } from '@/features/rules/ui/rule-faq-list'
import { RuleBrowser } from '@/features/rules/ui/rule-groups'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, PageHeading } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { HeaderAction, ScreenHeader } from '@/shared/ui/screen-header'
import styles from './rule-pages.module.css'

/** M06 생활 안내: search, 분야별 안내 tiles, FAQ TOP 5 and a 토로 tip. */
export function RulesPage() {
  const { t } = useTranslation()
  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('nav.rules')} description={t('rules.subtitle')} />
      <RuleBrowser />
    </PageBody>
  )
}

/** ‹ goes back when the screen was opened from inside 생활 안내, else to the list. */
function useRulesBack() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  return {
    label: t('common.back'),
    onClick: () => {
      if (state?.from === 'rules') void navigate(-1)
      else void navigate('/rules', { replace: true })
    },
  }
}

/** 자주 묻는 질문 전체 (M06 "전체 보기 ›"): every question with its short answer. */
export function RuleFaqPage() {
  const { t } = useTranslation()
  const back = useRulesBack()
  const { query, faqs } = useRuleFaqs()
  return (
    <>
      <ScreenHeader back={back} title={t('rules.faqAllTitle')} />
      <PageBody className={styles.body}>
        <QueryState query={query}>
          <RuleFaqList faqs={faqs} withAnswers />
        </QueryState>
      </PageBody>
    </>
  )
}

/** Figma v2 category screen at `/rules/category/:category`. */
export function RuleCategoryPage() {
  const { t } = useTranslation()
  const back = useRulesBack()
  const param = useParams().category
  const category = ruleCategories.find((value) => value === param)
  if (!category) return <Navigate to="/rules" replace />
  return (
    <>
      <ScreenHeader back={back} title={t(`rules.groups.${category}`)} />
      <PageBody className={styles.body}>
        <RuleCategoryView category={category} />
      </PageBody>
    </>
  )
}

/** Figma v2 guide detail: ‹ guide title · 공유. */
export function RuleDetailPage() {
  const { t } = useTranslation()
  const back = useRulesBack()
  const { code } = useParams()
  const { rule } = useRule(code ?? '')
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: rule?.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      }
    } catch {
      // Closing the share sheet rejects; nothing to tell the user.
    }
  }

  return (
    <>
      <ScreenHeader
        back={back}
        title={rule?.title ?? t('nav.rules')}
        actions={
          rule && (
            <HeaderAction onClick={() => void share()}>
              {copied ? t('rules.shareCopied') : t('rules.share')}
            </HeaderAction>
          )
        }
      />
      <PageBody className={styles.detailBody}>
        {code ? (
          <RuleDetail code={code} />
        ) : (
          <Muted>{t('rules.notFound')}</Muted>
        )}
      </PageBody>
    </>
  )
}
