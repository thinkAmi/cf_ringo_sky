import { Hono } from 'hono'
import { renderToString } from 'react-dom/server'

// ringo-db の DatabaseWorkerEntrypoint への service binding。戻り値は JSON 文字列。
type RingoDbWorker = {
  calculateTotalByName(): Promise<string>
  calculateTotalByNameAndMonth(): Promise<string>
  findGenealogyByName(appleName: string): Promise<string>
  findGenealogies(): Promise<string>
}

const app = new Hono<{ Bindings: { RINGO_DB_WORKER: RingoDbWorker } }>()

const totalRoute = app.get('/api/total', async (c) => {
  const total = await c.env.RINGO_DB_WORKER.calculateTotalByName()

  // ServiceBindingからの戻り値はJSON文字列なので、いったんJavaScriptオブジェクトに戻す
  const r = JSON.parse(total)
  return c.json(r)
})

const monthRoute = app.get('/api/month', async (c) => {
  const totalByMonth =
    await c.env.RINGO_DB_WORKER.calculateTotalByNameAndMonth()

  // ServiceBindingからの戻り値はJSON文字列なので、いったんJavaScriptオブジェクトに戻す
  const r = JSON.parse(totalByMonth)
  return c.json(r)
})

const genealogyRoute = app.get('/api/genealogies/:apple_name', async (c) => {
  const appleName = c.req.param('apple_name')

  const genealogy = await c.env.RINGO_DB_WORKER.findGenealogyByName(appleName)

  // ServiceBindingからの戻り値はJSON文字列なので、いったんJavaScriptオブジェクトに戻す
  const r = JSON.parse(genealogy)

  return c.json(r)
})

const genealogiesRoute = app.get('/api/genealogies', async (c) => {
  const genealogies = await c.env.RINGO_DB_WORKER.findGenealogies()

  // ServiceBindingからの戻り値はJSON文字列なので、いったんJavaScriptオブジェクトに戻す
  const r = JSON.parse(genealogies)

  return c.json(r)
})

// フロントエンドと型を共有するため、export type しておく
export type TotalRouteResponseType = typeof totalRoute
export type MonthRouteResponseType = typeof monthRoute
export type GenealogyRouteResponseType = typeof genealogyRoute
export type GenealogiesRouteResponseType = typeof genealogiesRoute

app.get('*', (c) => {
  return c.html(
    renderToString(
      <html lang={'ja'}>
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <title>React app</title>
          {import.meta.env.PROD ? (
            <script type="module" src="/static/client.js"></script>
          ) : (
            <script type="module" src="/src/client/index.tsx"></script>
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
