/**
 * Pre-scaffold templates for the React+Vite live app the user runs from
 * the editor. The banya CLI agent fills in src/App.tsx + src/pages/*.tsx
 * after we drop these scaffold files in place.
 *
 * Kept minimal: just enough so `vite dev` boots even before the agent
 * writes the screen components — that way the build pipeline can detect
 * scaffold success vs. agent failure separately.
 */

export interface ReactScaffoldOptions {
  projectName: string
  deviceType?: 'app' | 'web' | 'tablet' | string
}

export function buildReactScaffold(opts: ReactScaffoldOptions): Record<string, string> {
  const projectName = opts.projectName.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'vibesynth-app'
  return {
    'package.json': PACKAGE_JSON(projectName),
    'vite.config.ts': VITE_CONFIG,
    'tsconfig.json': TSCONFIG,
    'tsconfig.node.json': TSCONFIG_NODE,
    'index.html': INDEX_HTML(projectName),
    'src/main.tsx': MAIN_TSX,
    'src/App.tsx': PLACEHOLDER_APP_TSX,
    'src/index.css': INDEX_CSS,
    'src/vite-env.d.ts': VITE_ENV,
    '.gitignore': GITIGNORE,
  }
}

const PACKAGE_JSON = (name: string) => JSON.stringify({
  name,
  private: true,
  version: '0.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc && vite build',
    preview: 'vite preview',
  },
  dependencies: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  },
  devDependencies: {
    '@types/react': '^18.3.18',
    '@types/react-dom': '^18.3.5',
    '@vitejs/plugin-react': '^4.4.1',
    typescript: '^5.8.3',
    vite: '^6.3.1',
  },
}, null, 2) + '\n'

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true },
})
`

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noFallthroughCasesInSwitch: true,
  },
  include: ['src'],
  references: [{ path: './tsconfig.node.json' }],
}, null, 2) + '\n'

const TSCONFIG_NODE = JSON.stringify({
  compilerOptions: {
    composite: true,
    skipLibCheck: true,
    module: 'ESNext',
    moduleResolution: 'bundler',
    allowSyntheticDefaultImports: true,
  },
  include: ['vite.config.ts'],
}, null, 2) + '\n'

const INDEX_HTML = (title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

const MAIN_TSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`

const PLACEHOLDER_APP_TSX = `// Placeholder — banya CLI agent will replace this with the actual screens.
export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>VibeSynth</h1>
      <p>AI screens not yet generated.</p>
    </main>
  )
}
`

const INDEX_CSS = `:root { font-family: system-ui, sans-serif; }
* { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; height: 100%; }
`

const VITE_ENV = `/// <reference types="vite/client" />\n`

const GITIGNORE = `node_modules/
dist/
.vite/
*.log
`
