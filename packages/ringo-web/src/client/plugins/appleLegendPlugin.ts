import type { Chart, LegendItem } from 'chart.js'

type ChartType = Chart<'pie'> | Chart<'line'>

const getOrCreateLegendDiv = () => {
  const legendContainer = document.getElementById('apples-legend')
  let divContainer = legendContainer?.querySelector('div')
  if (divContainer) return divContainer

  divContainer = document.createElement('div')

  legendContainer?.appendChild(divContainer)

  return divContainer
}

export const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate: (chart: ChartType) => {
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

    const backgroundColors = chart.data.datasets.flatMap(
      (d) => d.backgroundColor,
    )
    if (backgroundColors.length === 0) return

    items.forEach((item: LegendItem) => {
      const divItem = document.createElement('div')
      divItem.style.display = 'flex'
      divItem.style.justifyContent = 'space-start'
      divItem.style.gap = '10px'
      // divItem.style.justifyItems = 'left'
      divItem.onclick = () => {
        // chartの種類により、 indexやdataIndexの有無が変わる
        if (item.index !== undefined) {
          chart.toggleDataVisibility(item.index)
          chart.update()
        } else if (item.datasetIndex != undefined) {
          chart.setDatasetVisibility(
            item.datasetIndex,
            !chart.isDatasetVisible(item.datasetIndex),
          )
          chart.update()
        }
      }

      const bg =
        item.index !== undefined
          ? backgroundColors[item.index]
          : item.datasetIndex != undefined
            ? backgroundColors[item.datasetIndex]
            : 'red'

      const colorContainer = document.createElement('div')
      // colorDiv.style = { background: bg } と指定した場合、以下のエラーになる
      // TS2540: Cannot assign to style because it is a read-only property.
      // そこで、styleの下の属性は1つずつ指定している
      colorContainer.style.background = bg as string

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
