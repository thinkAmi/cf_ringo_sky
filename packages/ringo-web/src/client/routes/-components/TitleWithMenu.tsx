import MenuIcon from '@mui/icons-material/Menu'
import { IconButton } from '@mui/material'
import { useState } from 'react'
import { RingoMenu } from './RingoMenu'

type Props = {
  title: string
}

export const TitleWithMenu = ({ title }: Props) => {
  const [open, setOpen] = useState(false)
  const handleClose = () => setOpen(false)

  return (
    <>
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center',
          justifyItems: 'center',
        }}
      >
        <IconButton onClick={() => setOpen(true)}>
          <MenuIcon />
        </IconButton>
        <RingoMenu open={open} handleClose={handleClose} />
        <h2>{title}</h2>
      </header>
    </>
  )
}
