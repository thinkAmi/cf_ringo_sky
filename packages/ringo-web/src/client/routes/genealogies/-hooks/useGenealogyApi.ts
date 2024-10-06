import { hc } from 'hono/client'

import { useQuery } from '@tanstack/react-query'
import type {
  GenealogiesRouteResponseType,
  GenealogyRouteResponseType,
} from '../../../../index'

export const useGenealogyApi = () => {
  const fetchGenealogyByName = (appleName: string) => {
    const client = hc<GenealogyRouteResponseType>('')

    const queryFn = async () => {
      const response = await client.api.genealogies[':apple_name'].$get({
        param: {
          apple_name: appleName,
        },
      })

      if (response.ok) {
        return await response.json()
      }
    }

    return useQuery({
      queryKey: ['fetchGenealogyByName'],
      queryFn: queryFn,
    })
  }

  const fetchGenealogies = () => {
    const client = hc<GenealogiesRouteResponseType>('')

    const queryFn = async () => {
      const response = await client.api.genealogies.$get()

      if (response.ok) {
        return await response.json()
      }
    }

    return useQuery({
      queryKey: ['fetchGenealogies'],
      queryFn: queryFn,
    })
  }

  return {
    fetchGenealogyByName,
    fetchGenealogies,
  }
}
