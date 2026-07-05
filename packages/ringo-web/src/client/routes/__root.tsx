import { Outlet, createRootRoute } from '@tanstack/react-router'

// MUI/emotion 撤去に伴う、アプリ全体のスタイル。
// このアプリは CSR(サーバは空シェルのみ)で CSS リンク機構が無いため、
// pseudo-class や transition が必要なものは root で <style> として注入する。
const appStyles = `
dialog.ringo-menu {
  margin: 0;
  height: 100dvh;
  max-height: 100dvh;
  padding: 0;
  border: none;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  transform: translateX(-100%);
  transition:
    transform 0.2s ease,
    display 0.2s allow-discrete,
    overlay 0.2s allow-discrete;
}
dialog.ringo-menu[open] {
  transform: translateX(0);
}
@starting-style {
  dialog.ringo-menu[open] {
    transform: translateX(-100%);
  }
}
dialog.ringo-menu::backdrop {
  background: rgba(0, 0, 0, 0.3);
}

.ringo-menu-item {
  display: block;
  padding: 12px 24px;
  text-decoration: none;
  color: inherit;
  white-space: nowrap;
}
.ringo-menu-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.genealogy-table {
  border-collapse: collapse;
  width: 100%;
}
.genealogy-table th,
.genealogy-table td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding: 12px 16px;
  text-align: left;
}
.genealogy-table tbody tr {
  cursor: pointer;
}
.genealogy-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.04);
}
`

export const Route = createRootRoute({
  component: () => (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: アプリ全体の静的CSS。ユーザー入力は含まない */}
      <style dangerouslySetInnerHTML={{ __html: appStyles }} />
      <Outlet />
    </>
  ),
})
