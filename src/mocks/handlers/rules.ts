import { http, HttpResponse } from 'msw'
import { ruleEntries } from '@/features/rules/content'
import type { RuleApiResponse } from '@/features/rules/api'
import { error } from '../db'

/**
 * The tax kinds the BE seed gives the tax rules (BE #29, RuleResponse.taxKind).
 * Mock-only copy: the app reads `taxKind` from the response.
 */
const taxKinds: Record<string, string> = {
  'tax-car': 'TAX_CAR',
  'tax-property': 'TAX_PROPERTY',
  'tax-resident': 'TAX_RESIDENT',
}

export const ruleHandlers = [
  // Only the fields the FE reads; the BE sends the whole rule (public API).
  http.get('*/api/rules/:code', ({ params }) => {
    const code = String(params.code)
    if (!ruleEntries.some((entry) => entry.code === code))
      return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    const body: RuleApiResponse = { code, taxKind: taxKinds[code] ?? null }
    return HttpResponse.json({ data: body })
  }),
]
