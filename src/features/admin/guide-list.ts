import type { GuideKind, GuideSummaryResponse } from './api'

/** Kinds edited on the checklist text screen. Rules have their own screen. */
export const guideKinds = [
  'CHECKLIST',
  'LIFE_CHANGE_TASK',
] as const satisfies readonly GuideKind[]
export type EditableGuideKind = (typeof guideKinds)[number]

/** Items of the checklist text screen: no living rules (ADM-06 edits them). */
export function editableGuides(guides: readonly GuideSummaryResponse[]) {
  return guides.filter((guide) => guide.kind !== 'RULE')
}

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
  kind: EditableGuideKind | '',
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
