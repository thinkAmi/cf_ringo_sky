import { DataGrid, type GridColDef, type GridRowParams } from '@mui/x-data-grid'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TitleWithMenu } from '../-components/TitleWithMenu'
import { fetchGenealogies } from './-api/genealogies'

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
  // loader が成功時のみ値を返す(失敗時は throw して errorComponent 表示)。
  // useLoaderData の型は T | undefined のため、型を満たすガードを置く。
  const data = Route.useLoaderData()
  if (!data) {
    return null
  }

  const applesWithId = data.map((d) => {
    return {
      id: d.appleName,
      ...d,
    }
  })

  const handleOnRowClick = (params: GridRowParams) => {
    navigate({
      to: '/genealogies/$appleName',
      params: { appleName: String(params.id) },
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
  loader: () => fetchGenealogies(),
})
