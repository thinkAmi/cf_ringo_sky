import { useNavigate } from '@tanstack/react-router'

type Props = {
  gridArea: string
  name: string
  displayName: string
}

export const AppleNameCard = ({ gridArea, name, displayName }: Props) => {
  const navigate = useNavigate()
  // 名前が不明である系譜図に遷移しても意味がないので、動作させない
  const isUnknown = name === 'unknown'
  const handleOnClick = () => {
    if (isUnknown) {
      return
    }
    navigate({
      to: '/genealogies/$appleName',
      params: { appleName: name },
    })
  }

  return (
    <div
      style={{
        gridArea: gridArea,
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: 4,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <button
        type={'button'}
        onClick={handleOnClick}
        disabled={isUnknown}
        style={{
          border: 'none',
          background: 'none',
          font: 'inherit',
          color: 'inherit',
          padding: 0,
          cursor: isUnknown ? 'default' : 'pointer',
        }}
      >
        {displayName}
      </button>
    </div>
  )
}
