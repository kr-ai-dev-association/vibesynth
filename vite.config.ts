import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

const root = path.resolve(__dirname, 'src/renderer')

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
