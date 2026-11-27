type Size = { width: number; height: number }

/**
 * Whether a point (relative to the element) lands on the picture drawn by
 * `object-fit: contain`, not on the empty bars around it.
 */
export function isOnContainedImage(
  point: { x: number; y: number },
  box: Size,
  natural: Size,
): boolean {
  if (natural.width <= 0 || natural.height <= 0) return false
  const scale = Math.min(box.width / natural.width, box.height / natural.height)
  return (
    Math.abs(point.x - box.width / 2) <= (natural.width * scale) / 2 &&
    Math.abs(point.y - box.height / 2) <= (natural.height * scale) / 2
  )
}
