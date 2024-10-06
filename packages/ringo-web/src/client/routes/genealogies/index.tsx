import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TitleWithMenu } from '../-components/TitleWithMenu'
import { genealogiesQueryOptions } from './-api/genealogies'

type Genealogy = {
  appleName: string
  appleDisplayName: string
  pollenName: string
  seedName: string
}

const columns: GridColDef[] = [
  {
    field: 'appleDisplayName',
    headerName: 'リンゴ名',
    editable: false,
    flex: 1,
  },
  {
    field: 'pollenDisplayName',
    headerName: '花粉親',
    editable: false,
    flex: 1,
  },
  {
    field: 'seedDisplayName',
    headerName: '種子親',
    editable: false,
    flex: 1,
  },
]

const GenealogiesComponent = () => {
  const navigate = useNavigate()
  const data = useSuspenseQuery(genealogiesQueryOptions).data

  const applesWithId = data.map((d: Genealogy) => {
    return {
      id: d.appleName,
      ...d,
    }
  })

  const handleOnRowClick = (params) => {
    navigate({
      to: '/genealogies/$appleName',
      params: { appleName: params.id },
    })
  }

  return (
    <>
      <TitleWithMenu title={'系譜図を表示可能なりんご一覧'} />
      <DataGrid
        columns={columns}
        rows={applesWithId}
        onRowClick={handleOnRowClick}
        autosizeOptions={{
          columns: ['appleDisplayName', 'pollenDisplayName', 'seedDisplayName'],
          includeHeaders: false,
          includeOutliers: true,
        }}
      />
    </>
  )
}

const Component = () => {
  return (
    <>
      <GenealogiesComponent />
    </>
  )
}

export const Route = createFileRoute('/genealogies/')({
  component: Component,
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(genealogiesQueryOptions),
})
