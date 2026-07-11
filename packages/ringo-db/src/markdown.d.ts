// wrangler.toml の [[rules]] (type = "Text") で *.md を文字列としてバンドルするための型宣言
declare module '*.md' {
  const content: string
  export default content
}
