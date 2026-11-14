import { useTranslation } from 'react-i18next'
import { languages } from '../shared/i18n'

const features = ['checklist', 'calendar', 'guide'] as const

export function HomePage() {
  const { t, i18n } = useTranslation()
  return (
    <div className="shell">
      <header className="header">
        <span className="brand">{t('brand')}</span>
        <label className="language">
          <span>{t('language')}</span>
          <select
            value={i18n.resolvedLanguage}
            onChange={(event) => void i18n.changeLanguage(event.target.value)}
          >
            {Object.entries(languages).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </header>
      <main>
        <section className="hero" aria-labelledby="welcome-title">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 id="welcome-title">{t('title')}</h1>
          <p className="description">{t('description')}</p>
        </section>
        <div className="features">
          {features.map((feature, index) => (
            <section className="feature" key={feature}>
              <span className="number" aria-hidden="true">
                0{index + 1}
              </span>
              <h2>{t(feature)}</h2>
              <p>{t(`${feature}Description`)}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
