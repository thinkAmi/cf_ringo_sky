import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'
import { getPlatformProxy } from 'wrangler'

export default defineConfig(async ({ mode }) => {
  const { env, dispose } = await getPlatformProxy()

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

  return {
    ssr: {
      external: ['react', 'react-dom'],
    },
    plugins: [
      build({
        entry: 'src/index.tsx',
      }),
      devServer({
        entry: 'src/index.tsx',
        // 0.26 で env/dispose は adapter オプションへ移動
        adapter: {
          env,
          onServerClose: dispose,
        },
      }),
    ],
  }
})
