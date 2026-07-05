import { useState } from 'react'
import { RingoMenu } from './RingoMenu'

type Props = {
  title: string
}

export const TitleWithMenu = ({ title }: Props) => {
  const [open, setOpen] = useState(false)
  const handleClose = () => setOpen(false)

  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      <button
        type={'button'}
        aria-label={'メニューを開く'}
        onClick={() => setOpen(true)}
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 48,
          height: 48,
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
        }}
      >
        <svg
          width={'24'}
          height={'24'}
          viewBox={'0 0 24 24'}
          fill={'none'}
          aria-hidden={'true'}
        >
          <path
            d={'M3 6h18M3 12h18M3 18h18'}
            stroke={'currentColor'}
            strokeWidth={'2'}
            strokeLinecap={'round'}
          />
        </svg>
      </button>
      <RingoMenu open={open} handleClose={handleClose} />
      <h2>{title}</h2>
    </header>
  )
}
