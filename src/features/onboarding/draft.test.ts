import { describe, expect, it } from 'vitest'
import {
  emptyDraft,
  isIsoDate,
  parseDraft,
  requestFromMember,
  toOnboardingRequest,
} from './draft'

describe('onboarding draft', () => {
  it('cannot be saved without the required user type', () => {
    expect(toOnboardingRequest(emptyDraft)).toBeUndefined()
  })

  it('sends skipped answers as null and an empty list', () => {
    expect(toOnboardingRequest({ ...emptyDraft, userType: 'NEW' })).toEqual({
      userType: 'NEW',
      entryDate: null,
      purpose: null,
      residences: [],
      stayExpiry: null,
    })
  })

  it('sends every answer and keeps residences in a stable order', () => {
    expect(
      toOnboardingRequest({
        userType: 'LIVING',
        entryDate: '2026-08-20',
        purpose: 'WORK',
        residences: ['F4', 'KIDS'],
        stayExpiry: '2027-12-10',
      }),
    ).toEqual({
      userType: 'LIVING',
      entryDate: '2026-08-20',
      purpose: 'WORK',
      residences: ['KIDS', 'F4'],
      stayExpiry: '2027-12-10',
    })
  })

  it('drops tampered or outdated stored values', () => {
    expect(
      parseDraft({
        userType: 'ADMIN',
        entryDate: '2026-02-30',
        purpose: 'TRAVEL',
        residences: ['CAR', 'BOAT', 'CAR'],
        stayExpiry: 12,
      }),
    ).toEqual({ ...emptyDraft, residences: ['CAR'] })
    expect(parseDraft('broken')).toEqual(emptyDraft)
  })

  it.each([
    ['2026-11-20', true],
    ['2028-02-29', true],
    ['2026-02-29', false],
    ['2026-13-01', false],
    ['20261120', false],
    ['', false],
  ])('validates calendar date %j', (value, valid) => {
    expect(isIsoDate(value)).toBe(valid)
  })
})

describe('editing one answer from M10', () => {
  const saved = {
    userType: 'LIVING' as const,
    entryDate: '2026-10-20',
    purpose: 'WORK' as const,
    residences: ['KIDS' as const, 'CAR' as const],
    stayExpiry: '2026-12-10',
  }

  it('keeps the other four answers so the PUT does not erase them', () => {
    expect(requestFromMember(saved, { stayExpiry: null })).toEqual({
      ...saved,
      stayExpiry: null,
    })
    expect(requestFromMember(saved, { residences: [] })).toEqual({
      ...saved,
      residences: [],
    })
  })

  it('needs a saved user type', () => {
    expect(
      requestFromMember({ ...saved, userType: null }, { purpose: 'STUDY' }),
    ).toBeUndefined()
  })
})
