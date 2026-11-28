import { z } from 'zod'
import type {
  AdminRuleDetail,
  RuleCreateRequest,
  RuleFaqRequest,
  RuleUpdateRequest,
} from './rule-api'
import type { AdminRuleFaq } from './rule-api'
import type { Language } from '@/shared/api/types'

/** Same limits as the BE RuleCreateRequest / RuleUpdateRequest. */
export const ruleMaxLength = {
  code: 50,
  category: 100,
  title: 255,
  summary: 5000,
  point: 2000,
  when: 2000,
  place: 2000,
  fee: 255,
  penalty: 2000,
  law: 255,
  contact: 255,
  sourceName: 255,
  sourceUrl: 2000,
} as const
const pointsMaxItems = 30
export const sourcesMaxItems = 10
const urlPattern = /^https?:\/\/\S+$/

const text = (max: number) => z.string().trim().max(max, 'admin.tooLong')

/** `points` textarea → one statement per non-blank line. */
export function pointLines(points: string) {
  return points
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export const ruleFormSchema = z.object({
  /** Only sent when creating; the URL slug, e.g. `waste-food`. */
  code: text(ruleMaxLength.code),
  category: text(ruleMaxLength.category).min(1, 'admin.rules.categoryRequired'),
  sortOrder: z
    .string()
    .trim()
    .regex(/^-?\d{1,9}$/, 'admin.rules.sortOrderInvalid'),
  faq: z.boolean(),
  title: text(ruleMaxLength.title).min(1, 'admin.titleRequired'),
  summary: text(ruleMaxLength.summary),
  // The BE needs content or points; this form writes points only.
  points: z.string().refine((value) => {
    const lines = pointLines(value)
    return (
      lines.length > 0 &&
      lines.length <= pointsMaxItems &&
      lines.every((line) => line.length <= ruleMaxLength.point)
    )
  }, 'admin.rules.pointsLimit'),
  when: text(ruleMaxLength.when),
  place: text(ruleMaxLength.place),
  fee: text(ruleMaxLength.fee),
  penalty: text(ruleMaxLength.penalty),
  law: text(ruleMaxLength.law),
  contact: text(ruleMaxLength.contact),
  sources: z
    .array(
      z.object({
        name: text(ruleMaxLength.sourceName).min(
          1,
          'admin.rules.sourceNameRequired',
        ),
        // A front-end hint only; the BE validates the same pattern.
        url: text(ruleMaxLength.sourceUrl).regex(
          urlPattern,
          'admin.documents.urlInvalid',
        ),
      }),
    )
    .max(sourcesMaxItems),
  checkedOn: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'admin.rules.dateInvalid'),
})
export type RuleForm = z.input<typeof ruleFormSchema>
type ParsedRuleForm = z.output<typeof ruleFormSchema>

/** Create needs a code; edit never sends one (it is in the URL). */
export const ruleCreateSchema = ruleFormSchema.refine(
  (form) => form.code.length > 0,
  { path: ['code'], message: 'admin.rules.codeRequired' },
)

export function toRuleForm(saved?: AdminRuleDetail | null): RuleForm {
  return {
    code: saved?.code ?? '',
    category: saved?.category ?? '',
    sortOrder: String(saved?.sortOrder ?? 0),
    faq: saved?.faq ?? false,
    title: saved?.title ?? '',
    summary: saved?.summary ?? '',
    points: (saved?.points ?? []).join('\n'),
    when: saved?.when ?? '',
    place: saved?.place ?? '',
    fee: saved?.fee ?? '',
    penalty: saved?.penalty ?? '',
    law: saved?.law ?? '',
    contact: saved?.contact ?? '',
    sources: saved?.sources.map(({ name, url }) => ({ name, url })) ?? [],
    checkedOn: saved?.checkedOn ?? '',
  }
}

const optional = (value: string) => value || null

/**
 * The BE replaces every text field, so fields this form does not show
 * (badge, docs, source name) are sent back as loaded. `content` is left for
 * the BE to rebuild from the statements, so it never goes stale.
 */
function toRuleBody(form: ParsedRuleForm, saved?: AdminRuleDetail | null) {
  return {
    category: form.category,
    sortOrder: Number(form.sortOrder),
    faq: form.faq,
    title: form.title,
    summary: optional(form.summary),
    content: null,
    badge: saved?.badge ?? null,
    place: optional(form.place),
    docs: saved?.docs ?? [],
    fee: optional(form.fee),
    law: optional(form.law),
    penalty: optional(form.penalty),
    contact: form.contact,
    sourceName: saved?.sourceName ?? null,
    points: pointLines(form.points),
    when: optional(form.when),
    sources: form.sources,
    checkedOn: optional(form.checkedOn),
  }
}

export function toRuleCreateRequest(form: ParsedRuleForm): RuleCreateRequest {
  return { code: form.code, ...toRuleBody(form) }
}

export function toRuleUpdateRequest(
  form: ParsedRuleForm,
  saved: AdminRuleDetail,
  noticeChanged: boolean,
): RuleUpdateRequest {
  return { ...toRuleBody(form, saved), noticeChanged }
}

// ---------------------------------------------------------------- FAQ

export const faqLanguages = [
  'ko',
  'en',
  'zh',
  'vi',
] as const satisfies readonly Language[]
export const faqMaxLength = { question: 500, answer: 5000 } as const

const faqText = z.object({
  question: text(faqMaxLength.question),
  answer: text(faqMaxLength.answer),
})

/**
 * Korean question and answer are required. Another language is sent only
 * when both are filled; half-filled is an error, empty means "show Korean".
 */
export const ruleFaqFormSchema = z
  .object({
    sortOrder: z
      .string()
      .trim()
      .regex(/^-?\d{1,9}$/, 'admin.rules.sortOrderInvalid'),
    ruleCode: z.string(),
    ko: faqText,
    en: faqText,
    zh: faqText,
    vi: faqText,
  })
  .superRefine((form, ctx) => {
    for (const language of faqLanguages) {
      const { question, answer } = form[language]
      const required = language === 'ko'
      if (!question && (required || answer))
        ctx.addIssue({
          code: 'custom',
          path: [language, 'question'],
          message: 'admin.faqs.questionRequired',
        })
      if (!answer && (required || question))
        ctx.addIssue({
          code: 'custom',
          path: [language, 'answer'],
          message: 'admin.faqs.answerRequired',
        })
    }
  })
export type RuleFaqForm = z.input<typeof ruleFaqFormSchema>
type ParsedRuleFaqForm = z.output<typeof ruleFaqFormSchema>

export function toRuleFaqForm(
  saved?: AdminRuleFaq | null,
  nextSortOrder = 1,
): RuleFaqForm {
  const textOf = (language: Language) => ({
    question: saved?.translations[language]?.question ?? '',
    answer: saved?.translations[language]?.answer ?? '',
  })
  return {
    sortOrder: String(saved?.sortOrder ?? nextSortOrder),
    ruleCode: saved && !saved.ruleDeleted ? (saved.ruleCode ?? '') : '',
    ko: textOf('ko'),
    en: textOf('en'),
    zh: textOf('zh'),
    vi: textOf('vi'),
  }
}

export function toRuleFaqRequest(form: ParsedRuleFaqForm): RuleFaqRequest {
  const translations: RuleFaqRequest['translations'] = { ko: form.ko }
  for (const language of faqLanguages)
    if (language !== 'ko' && form[language].question)
      translations[language] = form[language]
  return {
    sortOrder: Number(form.sortOrder),
    ruleCode: form.ruleCode,
    translations,
  }
}
