import styles from './step-progress.module.css'

/** Figma v2 onboarding "단계": `n / total` above a segmented bar. */
export function StepProgress({
  current,
  total,
  label,
}: {
  current: number
  total: number
  /** Visible text, e.g. "1 / 4". */
  label: string
}) {
  return (
    <div className={styles.step}>
      <p className={styles.label}>{label}</p>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={label}
      >
        {Array.from({ length: total }, (_, index) => (
          <span key={index} data-done={index < current} />
        ))}
      </div>
    </div>
  )
}
