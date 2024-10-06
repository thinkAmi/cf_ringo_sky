import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
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
import { htmlLegendPlugin } from '../plugins/appleLegendPlugin'
import { totalByMonthQueryOptions } from './-api/totalByMonth'
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

  const data = useSuspenseQuery(totalByMonthQueryOptions).data
  if (!data) {
    return
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
  return (
    <>
      <ChartComponent />
    </>
  )
}

export const Route = createFileRoute('/month')({
  component: Component,
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(totalByMonthQueryOptions),
})
