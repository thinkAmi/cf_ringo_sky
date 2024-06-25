import { hc } from 'hono/client'

import { useQuery } from '@tanstack/react-query'
import type {
  MonthRouteResponseType,
  TotalRouteResponseType,
} from '../../index'

export const useFeedsApi = () => {
  const calculateTotal = () => {
    const client = hc<TotalRouteResponseType>('')

    const queryFn = async () => {
      const response = await client.api.total.$get()
      if (response.ok) {
        return await response.json()
      }
    }

    return useQuery({
      queryKey: ['ApiTotal'],
      queryFn: queryFn,
    })
  }

  const calculateTotalByMonth = () => {
    const client = hc<MonthRouteResponseType>('')

    const queryFn = async () => {
      const response = await client.api.month.$get()
      if (response.ok) {
        return await response.json()
      }
    }

    return useQuery({
      queryKey: ['ApiMonth'],
      queryFn: queryFn,
    })
  }

  return {
    calculateTotal,
    calculateTotalByMonth,
  }
}
