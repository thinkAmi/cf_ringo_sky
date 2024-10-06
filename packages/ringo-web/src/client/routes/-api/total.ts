import { queryOptions } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { TotalRouteResponseType } from '../../../index'

const client = hc<TotalRouteResponseType>('')

const queryFn = async () => {
  const response = await client.api.total.$get()
  if (response.ok) {
    return await response.json()
  }
}

export const totalQueryOptions = queryOptions({
  queryKey: ['calculateTotal'],
  queryFn: () => queryFn(),
})
