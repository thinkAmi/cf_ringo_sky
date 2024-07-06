import { Hono } from 'hono'
import { renderToString } from 'react-dom/server'

const app = new Hono()

const totalRoute = app.get('/api/total', async (c) => {
  // @ts-ignore
  const total = await c.env.RINGO_DB_WORKER.calculateTotalByName()

  // ServiceBindingからの戻り値はJSON文字列なので、いったんJavaScriptオブジェクトに戻す
  const r = JSON.parse(total)
  return c.json(r)
})

const monthRoute = app.get('/api/month', async (c) => {
  const totalByMonth =
    // @ts-ignore
    await c.env.RINGO_DB_WORKER.calculateTotalByNameAndMonth()

  const r = JSON.parse(totalByMonth)
  return c.json(r)
})

// フロントエンドと型を共有するため、export type しておく
export type TotalRouteResponseType = typeof totalRoute
export type MonthRouteResponseType = typeof monthRoute

app.get('*', (c) => {
  return c.html(
    renderToString(
      <html lang={'ja'}>
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <title>React app</title>
          {import.meta.env.PROD ? (
            <>
              <script type="module" src="/static/client.js"></script>
            </>
          ) : (
            <>
              <script type="module" src="/src/client/index.tsx"></script>
            </>
          )}
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>,
    ),
  )
})

export default app
