import { useEffect, useState } from 'react'

/** Seconds left until `until` (epoch ms). 0 when it has passed or is unset. */
export function useCountdown(until: number | undefined): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!until) return
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (current >= until) window.clearInterval(timer)
    }
    const first = window.setTimeout(tick, 0)
    const timer = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [until])
  if (!until || now >= until) return 0
  return Math.ceil((until - now) / 1000)
}
