import { Box, Drawer, List } from '@mui/material'
import { RingoMenuItem } from './RingoMenuItem'

type Props = {
  open: boolean
  handleClose: () => void
}

export const RingoMenu = ({ open, handleClose }: Props) => {
  return (
    <Drawer open={open} onClose={handleClose}>
      <Box>
        <List>
          <RingoMenuItem to={'/'}>合計数量</RingoMenuItem>
          <RingoMenuItem to={'/month'}>月別数量</RingoMenuItem>
          <RingoMenuItem to={'/genealogies'}>系譜図</RingoMenuItem>
        </List>
      </Box>
    </Drawer>
  )
}
