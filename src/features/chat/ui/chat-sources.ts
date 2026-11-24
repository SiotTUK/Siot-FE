import type { SourceResponse } from '../api'

type SourceDocument = Pick<
  SourceResponse,
  'order' | 'documentName' | 'sourceUrl'
>
type PageRange = { start: number; end: number }
type DisplayPage = number | PageRange
export type ChatSource = SourceDocument & { pages: DisplayPage[] }
type SourceGroup = SourceDocument & { ranges: PageRange[] }

const MAX_INDIVIDUAL_PAGES = 10

function displayPages(ranges: PageRange[]): DisplayPage[] {
  const merged: PageRange[] = []
  for (const { start, end } of ranges.sort((a, b) => a.start - b.start)) {
    const previous = merged.at(-1)
    if (previous && start <= previous.end + 1) {
      previous.end = Math.max(previous.end, end)
    } else {
      merged.push({ start, end })
    }
  }

  return merged.flatMap<DisplayPage>((range) => {
    const length = range.end - range.start + 1
    return length <= MAX_INDIVIDUAL_PAGES
      ? Array.from({ length }, (_, offset) => range.start + offset)
      : [range]
  })
}

export function groupChatSources(
  sources: readonly SourceResponse[],
): ChatSource[] {
  const groups: SourceGroup[] = []
  const byDocument = new Map<string, SourceGroup>()

  for (const source of [...sources].sort((a, b) => a.order - b.order)) {
    const { order, documentName, sourceUrl, pageStart, pageEnd } = source
    const key =
      documentName?.trim() && sourceUrl?.trim()
        ? JSON.stringify([documentName, sourceUrl])
        : undefined
    let group = key ? byDocument.get(key) : undefined

    if (!group) {
      group = { order, documentName, sourceUrl, ranges: [] }
      groups.push(group)
      if (key) byDocument.set(key, group)
    }

    if (pageStart !== null) {
      group.ranges.push({
        start: pageStart,
        end: Math.max(pageStart, pageEnd ?? pageStart),
      })
    }
  }

  return groups.map(({ ranges, ...group }) => ({
    ...group,
    pages: displayPages(ranges),
  }))
}
