import { createFileRoute } from '@tanstack/react-router'
import { TitleWithMenu } from '../-components/TitleWithMenu'
import { fetchGenealogyByName } from './-api/genealogy'
import { AppleNameCard } from './-components/AppleNameCard'

const GenealogyChartComponent = () => {
  // loader が成功時のみ値を返す(失敗時は throw して errorComponent 表示)。
  // useLoaderData の型は T | undefined のため、型を満たすガードを置く。
  const data = Route.useLoaderData()
  if (!data) {
    return null
  }
  const genealogy = data[0]

  return (
    <>
      <TitleWithMenu title={'りんごの系譜図'} />
      <div
        style={{
          display: 'grid',
          gridTemplateAreas: `
          "self p pp ppp"
          "self p pp pps"
          "self p ps psp"
          "self p ps pss"
          "self s sp spp"
          "self s sp sps"
          "self s ss ssp"
          "self s ss sss"
         `,
          gridTemplateRows: `"100px" "180px" "180px"`,
        }}
      >
        <AppleNameCard
          gridArea={'self'}
          name={genealogy.apple}
          displayName={genealogy.appleDisplayName}
        />
        <AppleNameCard
          gridArea={'p'}
          name={genealogy.pollen}
          displayName={genealogy.pollenDisplayName}
        />
        <AppleNameCard
          gridArea={'pp'}
          name={genealogy.pollenPollen}
          displayName={genealogy.pollenPollenDisplayName}
        />
        <AppleNameCard
          gridArea={'ppp'}
          name={genealogy.pollenPollenPollen}
          displayName={genealogy.pollenPollenPollenDisplayName}
        />
        <AppleNameCard
          gridArea={'pps'}
          name={genealogy.pollenPollenSeed}
          displayName={genealogy.pollenPollenSeedDisplayName}
        />
        <AppleNameCard
          gridArea={'ps'}
          name={genealogy.pollenSeed}
          displayName={genealogy.pollenSeedDisplayName}
        />
        <AppleNameCard
          gridArea={'psp'}
          name={genealogy.pollenSeedPollen}
          displayName={genealogy.pollenSeedPollenDisplayName}
        />
        <AppleNameCard
          gridArea={'pss'}
          name={genealogy.pollenSeedSeed}
          displayName={genealogy.pollenSeedSeedDisplayName}
        />
        <AppleNameCard
          gridArea={'s'}
          name={genealogy.seed}
          displayName={genealogy.seedDisplayName}
        />
        <AppleNameCard
          gridArea={'sp'}
          name={genealogy.seedPollen}
          displayName={genealogy.seedPollenDisplayName}
        />
        <AppleNameCard
          gridArea={'spp'}
          name={genealogy.seedPollenPollen}
          displayName={genealogy.seedPollenPollenDisplayName}
        />
        <AppleNameCard
          gridArea={'sps'}
          name={genealogy.seedPollenSeed}
          displayName={genealogy.seedPollenSeedDisplayName}
        />
        <AppleNameCard
          gridArea={'ss'}
          name={genealogy.seedSeed}
          displayName={genealogy.seedSeedDisplayName}
        />
        <AppleNameCard
          gridArea={'ssp'}
          name={genealogy.seedSeedPollen}
          displayName={genealogy.seedSeedPollenDisplayName}
        />
        <AppleNameCard
          gridArea={'sss'}
          name={genealogy.seedSeedSeed}
          displayName={genealogy.seedSeedSeedDisplayName}
        />
      </div>
    </>
  )
}

const Component = () => {
  return (
    <>
      <GenealogyChartComponent />
    </>
  )
}

export const Route = createFileRoute('/genealogies/$appleName')({
  component: Component,
  loader: ({ params: { appleName } }) => fetchGenealogyByName(appleName),
})
