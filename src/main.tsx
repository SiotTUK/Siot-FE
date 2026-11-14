import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { queryClient } from './app/query-client'
import './shared/i18n'
import './styles.css'

async function bootstrap() {
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element is missing')

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap().catch((error: unknown) => {
  console.error('Application startup failed', error)
  const root = document.getElementById('root')
  if (root) root.textContent = '화면을 불러오지 못했습니다. 새로고침해 주세요.'
})
