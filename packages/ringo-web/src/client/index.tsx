import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'

// loader が throw した際に表示するエラー画面
const DefaultErrorComponent = ({ error }: { error: Error }) => (
  <div style={{ padding: '20px' }}>
    <h1>エラーが発生しました</h1>
    <p>データの取得に失敗しました。時間をおいて再度お試しください。</p>
    <pre style={{ color: 'crimson' }}>{error.message}</pre>
  </div>
)

const router = createRouter({
  routeTree: routeTree,
  // loader のキャッシュを 5 分保持し、往復ナビゲーションでの再取得を抑える
  defaultStaleTime: 1000 * 60 * 5,
  defaultErrorComponent: DefaultErrorComponent,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}
