import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

const root = path.resolve(__dirname, 'src/renderer')

// Load .env once so the main-process bundle gets VITE_*/GEMINI_* inlined too.
// (The renderer gets them via Vite's normal flow; the main process is built
// separately and at runtime in a packaged .app it can't see process.env.VITE_*
// because the .env file isn't bundled and Finder launches don't load shell
// rc files.)
const env = loadEnv('', __dirname, ['VITE_', 'GEMINI_'])
const electronDefine = Object.fromEntries(
  Object.entries(env).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
)

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
          define: electronDefine,
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
