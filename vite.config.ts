import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

const root = path.resolve(__dirname, 'src/renderer')

// IMPORTANT: do NOT inline secrets (VITE_GEMINI_API_KEY etc.) into the
// main-process bundle via `define`. Anything baked here ends up as a
// plain string literal in dist-electron/main.js and ships inside the
// packaged .app, leaking the key. The main process now reads its key at
// runtime from db.settings.apiKey first, then process.env, then a parsed
// .env file lookup — see electron/banya-cli.ts:resolveGeminiKey() and
// main.ts:resolveEffectiveGeminiKey(). At dev time `npm run dev`
// inherits process.env from the launching shell, which already has the
// .env values via dotenv loading on the renderer side.

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: path.resolve(__dirname, 'electron/main.ts'),
        onstart(args) {
          if (!process.env.VIBESYNTH_NO_ELECTRON) args.startup()
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: path.resolve(__dirname, 'electron/preload.ts'),
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
          },
        },
      },
      {
        entry: path.resolve(__dirname, 'electron/preload-live.ts'),
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
          },
        },
      },
      {
        entry: path.resolve(__dirname, 'electron/preload-pinterest.ts'),
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
    },
  },
  root,
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
  },
})
