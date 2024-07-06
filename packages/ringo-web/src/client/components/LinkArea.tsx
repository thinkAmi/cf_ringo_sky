import { Link } from '@tanstack/react-router'

type Props = {
  to: string
  text: string
}

export const LinkArea = ({ to, text }: Props) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
      <div />

      <Link
        to={to}
        style={{
          paddingTop: 20,
          fontSize: '80%',
        }}
      >
        {text}
      </Link>
    </div>
  )
}
