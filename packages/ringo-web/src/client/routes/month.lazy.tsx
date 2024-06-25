import { createLazyRoute } from '@tanstack/react-router'
import {
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Chart as chartJs,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useFeedsApi } from '../hooks/useFeedsApi'
import { htmlLegendPlugin } from '../plugins/appleLegendPlugin'

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

  const { calculateTotalByMonth } = useFeedsApi()
  const { data, isLoading } = calculateTotalByMonth()
  if (isLoading) return <div>Loading...</div>
  if (!data) return

  return (
    <>
      <h2 style={{ display: 'flex', justifyContent: 'center' }}>
        食べたリンゴたち(月別)
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
            id={'apples-legend'}
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
  return (
    <>
      <ChartComponent />
    </>
  )
}

export const Route = createLazyRoute('/month')({
  component: Component,
})
