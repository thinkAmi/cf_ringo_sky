import type { AppBskyFeedGetAuthorFeed } from '@atproto/api'
import { BskyAgent } from '@atproto/api'
import type { Record } from '@atproto/api/dist/client/types/app/bsky/feed/post'
import {
  filterNewFeeds,
  filterRingoFeeds,
  latestCreatedAt,
  matchName,
} from './feed'

// ringo-db の DatabaseWorkerEntrypoint への service binding のうち、ここで使う RPC メソッド
type RingoDbWorker = {
  insertFeeds(ringoFeeds: string): Promise<void>
}

export interface Env {
  IDENTIFIER: string
  APP_PASSWORD: string
  LAST_SEARCH_KV: KVNamespace
  RINGO_DB_WORKER: RingoDbWorker
}

const BSKY_KV_KEY = 'bskyFeed'

class Bsky {
  env: Env

  constructor(env: Env) {
    this.env = env
  }

  async run() {
    const agent = new BskyAgent({
      service: 'https://bsky.social',
    })

    await agent.login({
      identifier: this.env.IDENTIFIER || '',
      password: this.env.APP_PASSWORD || '',
    })

    const { bskyFeeds } = await this.fetchAuthorFeeds(agent)

    const lastSearchCreatedAt =
      (await this.env.LAST_SEARCH_KV.get(BSKY_KV_KEY)) ?? ''
    const newFeeds = filterNewFeeds(bskyFeeds, lastSearchCreatedAt)

    // 新しいfeedを取得できない場合、bskyに新しい投稿をしていないと判断できるので、処理終了とする
    if (newFeeds.length === 0) {
      return
    }

    const ringoFeeds = filterRingoFeeds(newFeeds)

    // 後で追跡できるよう、ログに登録したリンゴの投稿を書き込んでおく
    console.log(ringoFeeds)

    // サービスバインディングを使って、DBを更新する
    const jsonFeeds = JSON.stringify(ringoFeeds)
    await this.env.RINGO_DB_WORKER.insertFeeds(jsonFeeds)

    // 今回の検索情報をKVに書き込んでおく
    const latestCreateAt = latestCreatedAt(newFeeds)
    await this.env.LAST_SEARCH_KV.put(BSKY_KV_KEY, latestCreateAt)
  }

  async fetchAuthorFeeds(agent: BskyAgent) {
    const params: AppBskyFeedGetAuthorFeed.QueryParams = {
      actor: this.env.IDENTIFIER,
    }

    const {
      data: { feed },
    } = await agent.getAuthorFeed(params)

    const records = feed.map((f) => ({
      cid: f.post.cid,
      record: f.post.record as Record,
    }))

    const bskyFeeds = records.map(({ cid, record }) => {
      const ringoName = matchName(record.text)

      return {
        cid,
        name: ringoName ?? '',
        text: record.text,
        createdAt: record.createdAt,
      }
    })

    return { bskyFeeds }
  }
}

export default {
  async scheduled(_event, env) {
    const bsky = new Bsky(env)
    await bsky.run()
  },
} satisfies ExportedHandler<Env>
