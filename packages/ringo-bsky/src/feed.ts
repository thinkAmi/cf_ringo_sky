// Bluesky のフィードを集計・絞り込みする純粋関数群。
// ネットワークや Workers ランタイムに依存しないため、bun の内蔵テストランナーで単体テストできる。

export type BskyFeed = {
  cid: string
  name: string
  text: string
  createdAt: string
}

// バッククォートで囲まれた最初の品種名を取り出す。見つからなければ undefined。
export const matchName = (text: string) => {
  const match = text.match(/`([^`]+)`/)
  if (match?.[1]) {
    return match[1]
  }
}

// 前回検索時刻より新しい feed のみに絞り込む。
export const filterNewFeeds = (feeds: BskyFeed[], lastCreatedAt: string) =>
  feeds.filter((f) => f.createdAt > lastCreatedAt)

// 先頭が [リンゴ] で、かつ品種名が取れている feed のみに絞り込む。
export const filterRingoFeeds = (feeds: BskyFeed[]) =>
  feeds.filter((f) => f.text.startsWith('[リンゴ]') && !!f.name)

// 最新の feed の作成時刻を返す。取得できない場合は現在時刻を最後の検索時刻とする。
export const latestCreatedAt = (feeds: BskyFeed[]) =>
  feeds[0]?.createdAt ?? new Date().toISOString()
