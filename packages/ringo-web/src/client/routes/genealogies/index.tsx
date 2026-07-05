import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TitleWithMenu } from '../-components/TitleWithMenu'
import { fetchGenealogies } from './-api/genealogies'

const GenealogiesComponent = () => {
  const navigate = useNavigate()
  // loader が成功時のみ値を返す(失敗時は throw して errorComponent 表示)。
  // useLoaderData の型は T | undefined のため、型を満たすガードを置く。
  const data = Route.useLoaderData()
  if (!data) {
    return null
  }

  const handleRowClick = (appleName: string) => {
    navigate({
      to: '/genealogies/$appleName',
      params: { appleName },
    })
  }

  return (
    <>
      <TitleWithMenu title={'系譜図を表示可能なりんご一覧'} />
      <table className={'genealogy-table'}>
        <thead>
          <tr>
            <th>リンゴ名</th>
            <th>花粉親</th>
            <th>種子親</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr
              key={d.appleName}
              tabIndex={0}
              onClick={() => handleRowClick(d.appleName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRowClick(d.appleName)
                }
              }}
            >
              <td>{d.appleDisplayName}</td>
              <td>{d.pollenDisplayName}</td>
              <td>{d.seedDisplayName}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
