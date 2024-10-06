import { queryOptions } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { MonthRouteResponseType } from '../../../index'

const client = hc<MonthRouteResponseType>('')

const queryFn = async () => {
  const response = await client.api.month.$get()
  if (response.ok) {
    return await response.json()
  }
}

export const totalByMonthQueryOptions = queryOptions({
  queryKey: ['calculateTotalByMonth'],
  queryFn: () => queryFn(),
})
