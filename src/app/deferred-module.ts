import type { ComponentType } from 'react'

export interface DeferredScreen {
  getLoaded: () => ComponentType | null
  load: () => Promise<ComponentType>
}

export function deferredModule<Pages extends Record<string, ComponentType>>(
  load: () => Promise<Pages>,
) {
  let loaded: Pages | undefined
  let pending: Promise<Pages> | undefined
  let failed = false
  let reloadRequested = false

  return (page: keyof Pages): DeferredScreen => ({
    getLoaded: () => loaded?.[page] ?? null,
    async load() {
      if (failed && !reloadRequested) {
        // Failed module and stylesheet requests can stay cached in this document.
        reloadRequested = true
        window.location.reload()
      }

      pending ??= load().then(
        (pages) => (loaded = pages),
        (error: unknown) => {
          failed = true
          throw error
        },
      )
      return (await pending)[page]
    },
  })
}
