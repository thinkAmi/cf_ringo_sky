import type { ChartData } from 'chart.js'
import { hc } from 'hono/client'
import type { TotalRouteResponseType } from '../../../index'

const client = hc<TotalRouteResponseType>('')

// バックエンドは JSON.parse を挟むため hc の戻り値は any になる。
// 実際の形（Pie チャート用データ）を明示して loader/useLoaderData に型を通す。
// 失敗時は throw し、ルーターの errorComponent で表示する。
export const fetchTotal = async (): Promise<
  ChartData<'pie', number[], unknown>
> => {
  const response = await client.api.total.$get()
  if (!response.ok) {
    throw new Error(`品種別集計の取得に失敗しました (${response.status})`)
  }
  return await response.json()
}
