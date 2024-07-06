import { createLazyRoute } from '@tanstack/react-router'
import { ArcElement, Legend, Tooltip, Chart as chartJs } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { LinkArea } from '../components/LinkArea'
import { useFeedsApi } from '../hooks/useFeedsApi'
import { htmlLegendPlugin } from '../plugins/appleLegendPlugin'

const ChartComponent = () => {
  chartJs.register(ArcElement, Tooltip, Legend)
  // デフォルトのLegendはCanvasに描いているので表示しないようにする
  chartJs.overrides.pie.plugins.legend.display = false

  const { calculateTotal } = useFeedsApi()
  const { data, isLoading } = calculateTotal()

  if (isLoading) return <div>Loading...</div>
  if (!data) return

  return (
    <>
      <h2 style={{ display: 'flex', justifyContent: 'center' }}>
        食べたリンゴたち
      </h2>
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
            id={'apples-legend'}
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
  return (
    <>
      <ChartComponent />
      <LinkArea to={'/month'} text={'月別数量へ'} />
    </>
  )
}

export const Route = createLazyRoute('/')({
  component: Component,
})
