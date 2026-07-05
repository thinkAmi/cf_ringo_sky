import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'
import { getPlatformProxy } from 'wrangler'

export default defineConfig(async ({ mode, command }) => {
  if (mode === 'client') {
    return {
      build: {
        // Vite 8(Rolldown)では rollupOptions 相当は rolldownOptions
        rolldownOptions: {
          input: './src/client/index.tsx',
          output: {
            entryFileNames: 'static/client.js',
            chunkFileNames: 'static/[name]-[hash].js',
          },
        },
      },
      // tsr.config.json の内容はここへ移動
      plugins: [
        tanstackRouter({
          target: 'react',
          routesDirectory: './src/client/routes',
          generatedRouteTree: './src/client/routeTree.gen.ts',
          autoCodeSplitting: true,
        }),
      ],
    }
  }

  const plugins = [
    build({
      entry: 'src/index.tsx',
    }),
  ]

  // getPlatformProxy() は Miniflare を起動したままにするため、
  // dispose() を呼べる dev server 起動時のみ生成する（build で呼ぶとプロセスがハングする）
  if (command === 'serve') {
    const { env, dispose } = await getPlatformProxy()
    plugins.push(
      devServer({
        entry: 'src/index.tsx',
        // 0.26 で env/dispose は adapter オプションへ移動
        adapter: {
          env,
          onServerClose: dispose,
        },
      }),
    )
  }

  return {
    ssr: {
      external: ['react', 'react-dom'],
    },
    plugins,
  }
})
