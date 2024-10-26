import { queryOptions } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { GenealogyRouteResponseType } from '../../../../index'

const client = hc<GenealogyRouteResponseType>('')

const queryFn = async (appleName: string) => {
  const response = await client.api.genealogies[':apple_name'].$get({
    param: {
      apple_name: appleName,
    },
  })

  if (response.ok) {
    return await response.json()
  }
}

export const genealogyQueryOptions = (appleName: string) =>
  queryOptions({
    queryKey: ['fetchGenealogy', { appleName }],
    queryFn: () => queryFn(appleName),
  })
