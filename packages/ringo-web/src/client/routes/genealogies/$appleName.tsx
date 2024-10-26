import { createFileRoute } from '@tanstack/react-router'

import { useSuspenseQuery } from '@tanstack/react-query'

import { TitleWithMenu } from '../-components/TitleWithMenu'
import { genealogyQueryOptions } from './-api/genealogy'
import { AppleNameCard } from './-components/AppleNameCard'

type Genealogy = {
  apple: string
  appleDisplayName: string
  pollen: string
  pollenDisplayName: string
  pollenPollen: string
  pollenPollenDisplayName: string
  pollenPollenPollen: string
  pollenPollenPollenDisplayName: string
  pollenPollenSeed: string
  pollenPollenSeedDisplayName: string
  pollenSeed: string
  pollenSeedDisplayName: string
  pollenSeedPollen: string
  pollenSeedPollenDisplayName: string
  pollenSeedSeed: string
  pollenSeedSeedDisplayName: string
  seed: string
  seedDisplayName: string
  seedPollen: string
  seedPollenDisplayName: string
  seedPollenPollen: string
  seedPollenPollenDisplayName: string
  seedPollenSeed: string
  seedPollenSeedDisplayName: string
  seedSeed: string
  seedSeedDisplayName: string
  seedSeedPollen: string
  seedSeedPollenDisplayName: string
  seedSeedSeed: string
  seedSeedSeedDisplayName: string
}

const GenealogyChartComponent = () => {
  const { appleName } = Route.useParams()
  const query = useSuspenseQuery(genealogyQueryOptions(appleName))
  const genealogy: Genealogy = query.data[0]

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
  loader: async ({ context: { queryClient }, params: { appleName } }) =>
    await queryClient.ensureQueryData(genealogyQueryOptions(appleName)),
})
