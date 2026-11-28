import type { GuideKind, GuideSummaryResponse } from './api'

export const guideKinds = [
  'CHECKLIST',
  'LIFE_CHANGE_TASK',
  'RULE',
] as const satisfies readonly GuideKind[]

/** "CL-01 · 외국인등록", or the code alone when there is no Korean title. */
export function guideLabel(
  guide: Pick<GuideSummaryResponse, 'code' | 'title'>,
) {
  return guide.title ? `${guide.code} · ${guide.title}` : guide.code
}

/**
 * Options for the item picker: a placeholder, then the items of the chosen
 * kind in server order. A code opened by link (?code=) that is not in the
 * list (another kind, or not listed) stays selectable so it is not lost.
 */
export function guideOptions(
  guides: readonly GuideSummaryResponse[],
  kind: GuideKind | '',
  selected: string,
  placeholder: string,
) {
  const shown = guides.filter((guide) => !kind || guide.kind === kind)
  const options = shown.map((guide) => ({
    value: guide.code,
    label: guideLabel(guide),
  }))
  if (selected && !shown.some((guide) => guide.code === selected)) {
    const known = guides.find((guide) => guide.code === selected)
    options.unshift({
      value: selected,
      label: known ? guideLabel(known) : selected,
    })
  }
  return [{ value: '', label: placeholder }, ...options]
}
