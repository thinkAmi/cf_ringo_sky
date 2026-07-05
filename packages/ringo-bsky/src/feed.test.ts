import { describe, expect, test } from 'bun:test'
import {
  type BskyFeed,
  filterNewFeeds,
  filterRingoFeeds,
  latestCreatedAt,
  matchName,
} from './feed'

const feed = (override: Partial<BskyFeed>): BskyFeed => ({
  cid: 'cid',
  name: '',
  text: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...override,
})

describe('matchName', () => {
  test('バッククォートで囲まれた品種名を取り出す', () => {
    expect(matchName('[リンゴ]今日は `シナノゴールド` を食べた')).toBe(
      'シナノゴールド',
    )
  })

  test('最初のバッククォート組だけを取り出す', () => {
    expect(matchName('`王林` と `ふじ`')).toBe('王林')
  })

  test('バッククォートが無ければ undefined', () => {
    expect(matchName('リンゴを食べた')).toBeUndefined()
  })

  test('空のバッククォートは undefined', () => {
    expect(matchName('`` を食べた')).toBeUndefined()
  })
})

describe('filterNewFeeds', () => {
  test('前回検索時刻より新しい feed のみを残す', () => {
    const feeds = [
      feed({ cid: 'a', createdAt: '2024-01-01T00:00:00.000Z' }),
      feed({ cid: 'b', createdAt: '2024-01-03T00:00:00.000Z' }),
    ]
    const result = filterNewFeeds(feeds, '2024-01-02T00:00:00.000Z')
    expect(result.map((f) => f.cid)).toEqual(['b'])
  })

  test('境界値（同時刻）は残さない', () => {
    const feeds = [feed({ cid: 'a', createdAt: '2024-01-02T00:00:00.000Z' })]
    expect(filterNewFeeds(feeds, '2024-01-02T00:00:00.000Z')).toHaveLength(0)
  })

  test('前回検索時刻が空文字なら全件残す', () => {
    const feeds = [feed({ cid: 'a' }), feed({ cid: 'b' })]
    expect(filterNewFeeds(feeds, '')).toHaveLength(2)
  })
})

describe('filterRingoFeeds', () => {
  test('[リンゴ] 始まりかつ品種名ありのみ残す', () => {
    const feeds = [
      feed({ cid: 'ok', text: '[リンゴ]`王林`', name: '王林' }),
      feed({ cid: 'no-prefix', text: '`王林`', name: '王林' }),
      feed({ cid: 'no-name', text: '[リンゴ]今日は食べた', name: '' }),
    ]
    expect(filterRingoFeeds(feeds).map((f) => f.cid)).toEqual(['ok'])
  })
})

describe('latestCreatedAt', () => {
  test('先頭 feed の createdAt を返す', () => {
    const feeds = [
      feed({ createdAt: '2024-05-01T00:00:00.000Z' }),
      feed({ createdAt: '2024-04-01T00:00:00.000Z' }),
    ]
    expect(latestCreatedAt(feeds)).toBe('2024-05-01T00:00:00.000Z')
  })

  test('空配列なら現在時刻(ISO文字列)を返す', () => {
    const result = latestCreatedAt([])
    expect(() => new Date(result).toISOString()).not.toThrow()
    expect(new Date(result).toISOString()).toBe(result)
  })
})
