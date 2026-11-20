import styles from './step-header.module.css'

type StepHeaderProps = {
  backLabel: string
  onBack?: () => void
  /** Omit to hide progress (F02 has no progress bar). */
  step?: { current: number; total: number; label: string }
  skipLabel?: string
  onSkip?: () => void
  skipDisabled?: boolean
}

/** Onboarding header: ‹ back, skip on the right, `n / 4` progress. */
export function StepHeader({
  backLabel,
  onBack,
  step,
  skipLabel,
  onSkip,
  skipDisabled,
}: StepHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        {onBack ? (
          <button
            type="button"
            className={styles.back}
            onClick={onBack}
            aria-label={backLabel}
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : (
          <span />
        )}
        {onSkip && skipLabel && (
          <button
            type="button"
            className={styles.skip}
            onClick={onSkip}
            disabled={skipDisabled}
          >
            {skipLabel}
          </button>
        )}
      </div>
      {step && (
        <>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={step.total}
            aria-valuenow={step.current}
            aria-valuetext={step.label}
          >
            {Array.from({ length: step.total }, (_, index) => (
              <span
                key={index}
                className={styles.segment}
                data-done={index < step.current}
              />
            ))}
          </div>
          <p className={styles.label}>{step.label}</p>
        </>
      )}
    </header>
  )
}
