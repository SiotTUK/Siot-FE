import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { formatDateTime } from '@/shared/i18n/format'
import { ButtonLink } from '@/shared/ui/button'
import { CheckField, SelectField, TextField } from '@/shared/ui/field'
import { Card, Muted, Stack, Tag, Toolbar } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { AdminRuleSummary } from '../rule-api'
import { useAdminRules, useRuleCategories } from '../use-admin-rules'
import styles from './admin.module.css'

/** ADM-06: rules by category → order → code, with filters. */
export function RuleList() {
  const { t } = useTranslation()
  const [category, setCategory] = useState('')
  const [keyword, setKeyword] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const categories = useRuleCategories()
  const rules = useAdminRules({
    category,
    keyword: useDeferredValue(keyword),
    includeDeleted,
  })

  return (
    <>
      <Toolbar>
        <ButtonLink to="/admin/rules/new">{t('admin.rules.create')}</ButtonLink>
        <ButtonLink variant="secondary" to="/admin/rule-categories">
          {t('admin.menuRuleCategories')}
        </ButtonLink>
        <ButtonLink variant="secondary" to="/admin/rule-faqs">
          {t('admin.menuRuleFaqs')}
        </ButtonLink>
      </Toolbar>
      <Toolbar>
        <SelectField
          label={t('admin.rules.category')}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          options={[
            { value: '', label: t('admin.all') },
            ...(categories.data ?? []).map((item) => ({
              value: item.category,
              label: `${item.category} (${item.ruleCount})`,
            })),
          ]}
        />
        <TextField
          type="search"
          label={t('admin.rules.search')}
          placeholder={t('admin.rules.searchPlaceholder')}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </Toolbar>
      <CheckField
        label={t('admin.rules.includeDeleted')}
        checked={includeDeleted}
        onChange={(event) => setIncludeDeleted(event.target.checked)}
      />
      <QueryState query={rules}>
        {rules.data?.length === 0 ? (
          <Muted>{t('admin.empty')}</Muted>
        ) : (
          <Stack gap={10}>
            {rules.data?.map((rule) => (
              <RuleRow key={rule.code} rule={rule} />
            ))}
          </Stack>
        )}
      </QueryState>
    </>
  )
}

function RuleRow({ rule }: { rule: AdminRuleSummary }) {
  const { t } = useTranslation()
  return (
    <Link
      className="plain-link"
      to={`/admin/rules/${encodeURIComponent(rule.code)}`}
    >
      <Card>
        <strong>{rule.title}</strong>
        <Muted>
          {rule.code} · {rule.category} ·{' '}
          {t('admin.rules.order', { order: rule.sortOrder })}
        </Muted>
        <p className={styles.tags}>
          {rule.deleted && <Tag tone="danger">{t('admin.rules.deleted')}</Tag>}
          {rule.faq && <Tag tone="main">FAQ</Tag>}
          {rule.missingLanguages.length > 0 && (
            <Tag tone="warning">
              {t('admin.rules.missingLanguages', {
                languages: rule.missingLanguages.join(', '),
              })}
            </Tag>
          )}
        </p>
        {rule.updatedAt && (
          <Muted>
            {t('admin.updatedAt', {
              date: formatDateTime(rule.updatedAt, currentLanguage()),
            })}
          </Muted>
        )}
      </Card>
    </Link>
  )
}
