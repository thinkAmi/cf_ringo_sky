import { Card, CardContent, Typography } from '@mui/material'

import { useNavigate } from '@tanstack/react-router'

type Props = {
  gridArea: string
  name: string
  displayName: string
}

export const AppleNameCard = ({ gridArea, name, displayName }: Props) => {
  const navigate = useNavigate()
  const handleOnClick = () => {
    // 名前が不明である系譜図に遷移しても意味がないので、動作させない
    if (name === 'unknown') {
      return
    }

    navigate({
      to: '/genealogies/$appleName',
      params: { appleName: name },
    })
  }

  return (
    <Card variant={'outlined'} sx={{ gridArea: gridArea }}>
      <CardContent sx={{ display: 'grid', placeItems: 'center' }}>
        <Typography onClick={handleOnClick}>{displayName}</Typography>
      </CardContent>
    </Card>
  )
}
