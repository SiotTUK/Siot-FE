import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { emptyDraft, parseDraft, type OnboardingDraft } from './draft'
import { OnboardingContext } from './onboarding-context'

const storageKey = 'siot:onboarding-draft'

/** Draft is tied to the member so another account in the same tab starts fresh. */
function loadDraft(memberId: number): OnboardingDraft {
  try {
    const stored: unknown = JSON.parse(
      sessionStorage.getItem(storageKey) ?? 'null',
    )
    if (
      stored &&
      typeof stored === 'object' &&
      'memberId' in stored &&
      stored.memberId === memberId &&
      'draft' in stored
    )
      return parseDraft(stored.draft)
  } catch {
    /* Storage unavailable or corrupted: start over. */
  }
  return emptyDraft
}

function saveDraft(memberId: number, draft: OnboardingDraft | undefined) {
  try {
    if (draft)
      sessionStorage.setItem(storageKey, JSON.stringify({ memberId, draft }))
    else sessionStorage.removeItem(storageKey)
  } catch {
    /* Answers still live in memory for this visit. */
  }
}

/** Layout route for F02~F06: keeps answers between screens and across reloads. */
export function OnboardingProvider({ memberId }: { memberId: number }) {
  const [draft, setDraft] = useState(() => loadDraft(memberId))

  useEffect(() => saveDraft(memberId, draft), [draft, memberId])

  const update = useCallback(
    (patch: Partial<OnboardingDraft>) =>
      setDraft((current) => ({ ...current, ...patch })),
    [],
  )
  // Only drops the stored copy: resetting state here would make the step
  // guards bounce to F02 before the redirect to /home happens.
  const clear = useCallback(() => saveDraft(memberId, undefined), [memberId])

  const value = useMemo(
    () => ({ draft, update, clear }),
    [clear, draft, update],
  )
  return (
    <OnboardingContext.Provider value={value}>
      <Outlet />
    </OnboardingContext.Provider>
  )
}
