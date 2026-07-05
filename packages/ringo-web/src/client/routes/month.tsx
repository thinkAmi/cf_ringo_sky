import { createFileRoute } from '@tanstack/react-router'
import {
  CategoryScale,
  Chart as chartJs,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { htmlLegendPlugin } from '../plugins/appleLegendPlugin'
import { fetchTotalByMonth } from './-api/totalByMonth'
import { TitleWithMenu } from './-components/TitleWithMenu'

const ChartComponent = () => {
  chartJs.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
  )

  const options = {
    plugins: {
      legend: {
        display: false,
      },
    },
  }

  // Line chartの場合、overridesすると以下のエラーになるため、コメントアウトしている
  //   Error: Cannot read properties of undefined (reading 'legend')
  // chartJs.overrides.line.plugins.legend.display = false

  // loader が成功時のみ値を返す(失敗時は throw して errorComponent 表示)。
  // useLoaderData の型は T | undefined のため、型を満たすガードを置く。
  const data = Route.useLoaderData()
  if (!data) {
    return null
  }

  return (
    <>
      <TitleWithMenu title={'食べたリンゴたち(月別)'} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '40px',
        }}
      >
        <div
          style={{
            height: 300,
            display: 'flex',
            justifyContent: 'space-between',
            flexBasis: '50%',
          }}
        >
          <div style={{ flexBasis: '150%' }}>
            <Line data={data} plugins={[htmlLegendPlugin]} options={options} />
          </div>
          <div
            id={'appleColors-legend'}
            style={{
              maxHeight: '100%',
              overflowY: 'auto',
              width: '270px',
              padding: '10px',
              boxSizing: 'border-box',
              backgroundColor: '#f9f9f9',
            }}
          />
        </div>
      </div>
    </>
  )
}

const Component = () => {
  return <ChartComponent />
}

export const Route = createFileRoute('/month')({
  component: Component,
  loader: () => fetchTotalByMonth(),
})
