import { queryOptions } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { GenealogiesRouteResponseType } from '../../../../index'

const client = hc<GenealogiesRouteResponseType>('')

const queryFn = async () => {
  const response = await client.api.genealogies.$get()

  if (response.ok) {
    return await response.json()
  }
}

export const genealogiesQueryOptions = queryOptions({
  queryKey: ['fetchGenealogy'],
  queryFn: () => queryFn(),
})
