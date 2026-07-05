import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  handleClose: () => void
}

export const RingoMenu = ({ open, handleClose }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // open の状態をネイティブ dialog の showModal/close に同期する。
  // Esc・フォーカス管理・backdrop 描画はブラウザ標準に委譲する。
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // 背景(backdrop)クリックで閉じる。JSX の onClick は a11y ルールに触れるため、
  // ネイティブイベントで処理する(キーボードは Esc をブラウザ標準で処理)。
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        handleClose()
      }
    }
    dialog.addEventListener('click', onBackdropClick)
    return () => {
      dialog.removeEventListener('click', onBackdropClick)
    }
  }, [handleClose])

  return (
    <dialog ref={dialogRef} className={'ringo-menu'} onClose={handleClose}>
      <nav>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, minWidth: 200 }}>
          <li>
            <Link to={'/'} preload={'intent'} className={'ringo-menu-item'}>
              合計数量
            </Link>
          </li>
          <li>
            <Link
              to={'/month'}
              preload={'intent'}
              className={'ringo-menu-item'}
            >
              月別数量
            </Link>
          </li>
          <li>
            <Link
              to={'/genealogies'}
              preload={'intent'}
              className={'ringo-menu-item'}
            >
              系譜図
            </Link>
          </li>
        </ul>
      </nav>
    </dialog>
  )
}
