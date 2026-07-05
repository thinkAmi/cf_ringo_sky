import type { ChartData, Point } from 'chart.js'
import { hc } from 'hono/client'
import type { MonthRouteResponseType } from '../../../index'

const client = hc<MonthRouteResponseType>('')

// バックエンドは JSON.parse を挟むため hc の戻り値は型付かない({})。
// 実際の形（Line チャート用データ）へキャストして loader/useLoaderData に型を通す。
// 失敗時は throw し、ルーターの errorComponent で表示する。
export const fetchTotalByMonth = async (): Promise<
  ChartData<'line', (number | Point | null)[], unknown>
> => {
  const response = await client.api.month.$get()
  if (!response.ok) {
    throw new Error(`月別集計の取得に失敗しました (${response.status})`)
  }
  return (await response.json()) as ChartData<
    'line',
    (number | Point | null)[],
    unknown
  >
}
