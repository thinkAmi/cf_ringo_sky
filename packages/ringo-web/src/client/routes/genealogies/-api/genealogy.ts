import { hc } from 'hono/client'
import type { GenealogyRouteResponseType } from '../../../../index'

export type Genealogy = {
  apple: string
  appleDisplayName: string
  pollen: string
  pollenDisplayName: string
  pollenPollen: string
  pollenPollenDisplayName: string
  pollenPollenPollen: string
  pollenPollenPollenDisplayName: string
  pollenPollenSeed: string
  pollenPollenSeedDisplayName: string
  pollenSeed: string
  pollenSeedDisplayName: string
  pollenSeedPollen: string
  pollenSeedPollenDisplayName: string
  pollenSeedSeed: string
  pollenSeedSeedDisplayName: string
  seed: string
  seedDisplayName: string
  seedPollen: string
  seedPollenDisplayName: string
  seedPollenPollen: string
  seedPollenPollenDisplayName: string
  seedPollenSeed: string
  seedPollenSeedDisplayName: string
  seedSeed: string
  seedSeedDisplayName: string
  seedSeedPollen: string
  seedSeedPollenDisplayName: string
  seedSeedSeed: string
  seedSeedSeedDisplayName: string
}

const client = hc<GenealogyRouteResponseType>('')

// バックエンドは JSON.parse を挟むため hc の戻り値は any になる。
// 実際の形を明示して loader/useLoaderData に型を通す。
// 失敗時は throw し、ルーターの errorComponent で表示する。
export const fetchGenealogyByName = async (
  appleName: string,
): Promise<Genealogy[]> => {
  const response = await client.api.genealogies[':apple_name'].$get({
    param: {
      apple_name: appleName,
    },
  })
  if (!response.ok) {
    throw new Error(`系譜の取得に失敗しました (${response.status})`)
  }
  return await response.json()
}
