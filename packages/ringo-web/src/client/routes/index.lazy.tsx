import { createLazyRoute } from '@tanstack/react-router'
import {
  ArcElement,
  Legend,
  type LegendItem,
  Tooltip,
  Chart as chartJs,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { useFeedsApi } from '../hooks/useFeedsApi'
import { htmlLegendPlugin } from '../plugins/appleLegendPlugin'

type PieChartType = chartJs<'pie'>

const getOrCreateLegendDiv = () => {
  const legendContainer = document.getElementById('apples-legend')
  let divContainer = legendContainer?.querySelector('div')
  if (divContainer) return divContainer

  divContainer = document.createElement('div')

  legendContainer?.appendChild(divContainer)

  return divContainer
}

const htmlLegendPlugin2 = {
  id: 'htmlLegend',
  afterUpdate: (chart: PieChartType) => {
    const divContainer = getOrCreateLegendDiv()

    // Remove old legend items
    while (divContainer.firstChild) {
      divContainer.firstChild.remove()
    }

    const chartLabels = chart?.options?.plugins?.legend?.labels
    if (!chartLabels) return

    // @ts-ignore
    const items = chartLabels.generateLabels(chart)
    if (items === undefined) return

    const backgroundColors = chart.data.datasets[0]?.backgroundColor
    if (!backgroundColors) return

    items.forEach((item: LegendItem) => {
      if (item.index === undefined) return
      const divItem = document.createElement('div')
      divItem.style.display = 'flex'
      divItem.style.justifyContent = 'space-start'
      divItem.style.gap = '10px'
      // divItem.style.justifyItems = 'left'
      divItem.onclick = () => {
        if (item.index !== undefined) {
          chart.toggleDataVisibility(item.index)
          chart.update()
        }
      }

      // @ts-ignore
      const bg = backgroundColors[item.index] ?? 'red'

      const colorContainer = document.createElement('div')
      // colorDiv.style = { background: bg } と指定した場合、以下のエラーになる
      // TS2540: Cannot assign to style because it is a read-only property.
      // そこで、styleの下の属性は1つずつ指定している
      colorContainer.style.background = bg

      // 色見本を円で表示する
      colorContainer.style.width = '12px'
      colorContainer.style.height = '12px'
      colorContainer.style.borderRadius = '50%'

      const textContainer = document.createElement('div')
      textContainer.style.textDecoration = item.hidden ? 'line-through' : ''
      textContainer.style.fontSize = '75%'
      textContainer.appendChild(document.createTextNode(item.text))

      divItem.appendChild(colorContainer)
      divItem.appendChild(textContainer)
      divContainer.appendChild(divItem)
    })

    const customLegend = document.getElementById('custom-legend')
    customLegend?.appendChild(divContainer)
  },
}

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
    </>
  )
}

export const Route = createLazyRoute('/month')({
  component: Component,
})
