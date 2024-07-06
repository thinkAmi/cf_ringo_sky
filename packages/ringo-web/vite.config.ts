import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { defineConfig } from 'vite'
import { getPlatformProxy } from 'wrangler'

export default defineConfig(async ({ mode }) => {
  const { env, dispose } = await getPlatformProxy()

  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: './src/client/index.tsx',
          output: {
            entryFileNames: 'static/client.js',
            chunkFileNames: 'static/[name]-[hash].js',
          },
        },
      },
      plugins: [TanStackRouterVite()],
    }
  }

  return {
    ssr: {
      external: ['react', 'react-dom'],
    },
    plugins: [
      pages({
        entry: ['src/index.tsx'],
      }),
      devServer({
        entry: 'src/index.tsx',
        env: env,
        plugins: [
          {
            onServerClose: dispose,
          },
        ],
      }),
    ],
  }
})
