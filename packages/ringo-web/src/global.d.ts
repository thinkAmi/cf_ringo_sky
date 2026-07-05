// hono の型を拡張するモジュール補完。空 export でモジュール扱いにし、
// 既存の 'hono' モジュールを置換ではなく拡張する。
export {}

declare module 'hono' {
  interface ContextRenderer {
    // biome-ignore lint/style/useShorthandFunctionType: hono の interface を宣言マージで拡張するため type にはできない
    (content: string | Promise<string>, props?: { title?: string }): Response
  }
}
