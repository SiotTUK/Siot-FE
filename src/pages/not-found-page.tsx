import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="shell not-found">
      <h1>{t('notFound')}</h1>
      <Link to="/">{t('home')}</Link>
    </main>
  )
}
