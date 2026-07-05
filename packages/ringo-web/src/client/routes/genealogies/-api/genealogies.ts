import { hc } from 'hono/client'
import type { GenealogiesRouteResponseType } from '../../../../index'

export type Genealogy = {
  appleName: string
  appleDisplayName: string
  pollenName: string
  pollenDisplayName: string
  seedName: string
  seedDisplayName: string
}

const client = hc<GenealogiesRouteResponseType>('')

// バックエンドは JSON.parse を挟むため hc の戻り値は any になる。
// 実際の形を明示して loader/useLoaderData に型を通す。
// 失敗時は throw し、ルーターの errorComponent で表示する。
export const fetchGenealogies = async (): Promise<Genealogy[]> => {
  const response = await client.api.genealogies.$get()
  if (!response.ok) {
    throw new Error(`系譜一覧の取得に失敗しました (${response.status})`)
  }
  return await response.json()
}
