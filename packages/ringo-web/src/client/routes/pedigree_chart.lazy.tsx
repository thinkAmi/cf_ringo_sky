import { createLazyRoute } from '@tanstack/react-router'
import { LinkArea } from '../components/LinkArea'

const PedigreeChartComponent = () => {
  // TODO APIから親子情報のデータを取得する
  // const { calculateTotalByMonth } = useFeedsApi()
  // const { data, isLoading } = calculateTotalByMonth()
  // if (isLoading) return <div>Loading...</div>
  // if (!data) return

  return (
    <>
      <h2 style={{ display: 'flex', justifyContent: 'center' }}>
        りんごの系譜図
      </h2>
      {/* https://stackoverflow.com/questions/47743472/how-to-use-grid-template-areas-in-react-inline-style */}
      <div
        style={{
          display: 'grid',
          gridTemplateAreas: `
          "f ff fff"
          "f ff ffm"
          "f fm fmf"
          "f fm fmm"
          "m mf mff"
          "m mf mfm"
          "m mm mmf"
          "m mm mmm"
         `,
        }}
      >
        <div style={{ gridArea: 'f' }}>シナノレッド</div>
        <div style={{ gridArea: 'ff' }}>ビスタベラ</div>
        <div style={{ gridArea: 'fff' }}>不明</div>
        <div style={{ gridArea: 'ffm' }}>不明</div>
        <div style={{ gridArea: 'fm' }}>つがる</div>
        <div style={{ gridArea: 'fmf' }}>紅玉</div>
        <div style={{ gridArea: 'fmm' }}>ゴールデンデリシャス</div>
        <div style={{ gridArea: 'm' }}>千秋</div>
        <div style={{ gridArea: 'mf' }}>ふじ</div>
        <div style={{ gridArea: 'mff' }}>デリシャス</div>
        <div style={{ gridArea: 'mfm' }}>国光</div>
        <div style={{ gridArea: 'mm' }}>東光</div>
        <div style={{ gridArea: 'mmf' }}>印度</div>
        <div style={{ gridArea: 'mmm' }}>ゴールデンデリシャス</div>
      </div>
    </>
  )
}

const Component = () => {
  return (
    <>
      <PedigreeChartComponent />
      <LinkArea to={'/'} text={'合計数量へ'} />
    </>
  )
}

export const Route = createLazyRoute('/pedigree_chart')({
  component: Component,
})
