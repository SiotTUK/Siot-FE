import type { SourceResponse } from '../api'

type SourceDocument = Pick<
  SourceResponse,
  'order' | 'documentName' | 'sourceUrl'
>
export type ChatSource = SourceDocument & { pages: number[] }
type SourceGroup = SourceDocument & { pages: Set<number> }

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
      group = { order, documentName, sourceUrl, pages: new Set() }
      groups.push(group)
      if (key) byDocument.set(key, group)
    }

    if (pageStart !== null) {
      const end = Math.max(pageStart, pageEnd ?? pageStart)
      for (let page = pageStart; page <= end; page++) {
        group.pages.add(page)
      }
    }
  }

  return groups.map((group) => ({
    ...group,
    pages: [...group.pages].sort((a, b) => a - b),
  }))
}
