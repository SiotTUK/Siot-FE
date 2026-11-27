export async function shareEvent(
  title: string,
  url: string,
  browser: {
    share?: Navigator['share']
    clipboard?: Pick<Clipboard, 'writeText'>
  },
) {
  if (typeof browser.share === 'function') {
    try {
      await browser.share({ title, url })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        return 'cancelled'
    }
  }
  if (!browser.clipboard) return 'manual'
  try {
    await browser.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'manual'
  }
}
