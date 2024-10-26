import { type ButtonProps, ListItem, ListItemButton } from '@mui/material'
import { type LinkComponent, createLink } from '@tanstack/react-router'
import React from 'react'

type MuiLinkProps = Omit<ButtonProps, 'href'>

const MuiLinkComponent = React.forwardRef<HTMLAnchorElement, MuiLinkProps>(
  (props, ref) => {
    return (
      <ListItem>
        <ListItemButton component={'a'} ref={ref} {...props} />
      </ListItem>
    )
  },
)

const CreatedLinkComponent = createLink(MuiLinkComponent)

export const RingoMenuItem: LinkComponent<typeof MuiLinkComponent> = (
  props,
) => {
  return <CreatedLinkComponent preload={'intent'} {...props} />
}
