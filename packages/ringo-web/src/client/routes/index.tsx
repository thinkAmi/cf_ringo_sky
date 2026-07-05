import { createFileRoute } from '@tanstack/react-router'
import { ArcElement, Chart as chartJs, Legend, Tooltip } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { htmlLegendPlugin } from '../plugins/appleLegendPlugin'
import { fetchTotal } from './-api/total'
import { TitleWithMenu } from './-components/TitleWithMenu'

const ChartComponent = () => {
  chartJs.register(ArcElement, Tooltip, Legend)
  // デフォルトのLegendはCanvasに描いているので表示しないようにする
  chartJs.overrides.pie.plugins.legend.display = false

  // loader が成功時のみ値を返す(失敗時は throw して errorComponent 表示)。
  // useLoaderData の型は T | undefined のため、型を満たすガードを置く。
  const data = Route.useLoaderData()
  if (!data) {
    return null
  }

  return (
    <>
      <TitleWithMenu title={'食べたリンゴたち'} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '40px',
        }}
      >
        <div
          style={{
            width: 700,
            height: 300,
            display: 'flex',
            justifyContent: 'space-between',
            flexBasis: '50%',
          }}
        >
          <div style={{ flexBasis: '50%' }}>
            <Pie data={data} plugins={[htmlLegendPlugin]} />
          </div>
          <div
            id={'appleColors-legend'}
            style={{
              maxHeight: '100%',
              overflowY: 'auto',
              width: '200px',
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

export const Route = createFileRoute('/')({
  component: Component,
  loader: () => fetchTotal(),
})
