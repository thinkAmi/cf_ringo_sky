// @ts-ignore
import type { ExportedHandler, WorkerEntrypoint } from 'cloudflare:workers'
import { BskyAgent } from '@atproto/api'
import type { AppBskyFeedGetAuthorFeed } from '@atproto/api'
import type { Record } from '@atproto/api/dist/client/types/app/bsky/feed/post'
import type { KVNamespace } from '@cloudflare/workers-types'

export interface Env {
  IDENTIFIER: string
  APP_PASSWORD: string
  LAST_SEARCH_KV: KVNamespace
  RINGO_DB_WORKER: WorkerEntrypoint
}

type BskyFeed = {
  cid: string
  name: string
  text: string
  createdAt: string
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
    const newFeeds = this.filterNewFeeds(bskyFeeds, lastSearchCreatedAt)

    // 新しいfeedを取得できない場合、bskyに新しい投稿をしていないと判断できるので、処理終了とする
    if (newFeeds.length === 0) {
      return
    }

    const ringoFeeds = this.filterRingoFeeds(newFeeds)

    // 後で追跡できるよう、ログに登録したリンゴの投稿を書き込んでおく
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(ringoFeeds)

    // サービスバインディングを使って、DBを更新する
    const jsonFeeds = JSON.stringify(ringoFeeds)
    await this.env.RINGO_DB_WORKER.insertFeeds(jsonFeeds)

    // 今回の検索情報をKVに書き込んでおく
    const latestCreateAt = this.latestCreatedAt(newFeeds)
    await this.env.LAST_SEARCH_KV.put(BSKY_KV_KEY, latestCreateAt)
  }

  filterNewFeeds(feeds: BskyFeed[], lastCreatedAt: string) {
    return feeds.filter((f) => f.createdAt > lastCreatedAt)
  }

  filterRingoFeeds(feeds: BskyFeed[]) {
    return feeds.filter((f) => f.text.startsWith('[リンゴ]') && !!f.name)
  }

  latestCreatedAt(feeds: BskyFeed[]) {
    // 取得できない場合は、現在日時を最後に検索した日時に設定する
    return feeds[0]?.createdAt ?? new Date().toISOString()
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
      const ringoName = this.matchName(record.text)

      return {
        cid,
        name: ringoName ?? '',
        text: record.text,
        createdAt: record.createdAt,
      }
    })

    return { bskyFeeds }
  }

  matchName(text: string) {
    const match = text.match(/`([^`]+)`/)
    if (match?.[1]) {
      return match[1]
    }
  }
}

export default {
  async scheduled(_event: any, env: Env) {
    const bsky = new Bsky(env)
    await bsky.run()
  },
} as ExportedHandler<Env>
