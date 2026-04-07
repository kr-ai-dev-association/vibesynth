import { useState, useEffect, Component, type ReactNode } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import { Settings } from './pages/Settings'
import { designGuideDB } from './lib/design-guide-db'
import { I18nProvider } from './lib/i18n'

// Error Boundary to prevent full blackout on render errors
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui', background: '#0f0f17', color: '#e2e8f0', height: '100vh' }}>
          <h2 style={{ color: '#f87171', marginBottom: 12 }}>Something went wrong</h2>
          <pre style={{ background: '#1a1a2e', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: '8px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export type AppView = 'dashboard' | 'editor' | 'settings'

export interface Project {
  id: string
  name: string
  prompt?: string
  updatedAt: string
  thumbnail?: string
  screens: Screen[]
  designSystem?: DesignSystem
  deviceType: 'app' | 'web' | 'tablet'
}

export interface HeatmapZone {
  cssPath: string
  tagName: string
  label: string
  intensity: number
  reason: string
  rect: { x: number; y: number; w: number; h: number }
}

export interface Screen {
  id: string
  name: string
  html: string
  heatmap?: HeatmapZone[]
  /** True while AI is still generating this screen's HTML */
  generating?: boolean
  /** User-set custom width via drag resize */
  customWidth?: number
  /** User-set custom height via drag resize */
  customHeight?: number
}

export interface DesignGuide {
  overview: string
  colorRules: string
  typographyRules: string
  elevationRules: string
  componentRules: string
  dosAndDonts: string
}

export interface ComponentTokens {
  buttonRadius: string
  buttonPadding: string
  buttonFontWeight: string
  inputRadius: string
  inputBorder: string
  inputPadding: string
  inputBg: string
  cardRadius: string
  cardShadow: string
  cardPadding: string
  chipRadius: string
  chipPadding: string
  chipBg: string
  fabSize: string
  fabRadius: string
}

export interface TypographyLevel {
  family: string
  size?: string
  weight?: string
  lineHeight?: string
}

export type ColorSchemeMode = 'light' | 'dark' | 'auto'

export interface DesignSystem {
  name: string
  colorScheme?: ColorSchemeMode  // default: 'auto' (AI decides based on prompt)
  colors: {
    primary: { base: string; tones: string[] }
    secondary: { base: string; tones: string[] }
    tertiary: { base: string; tones: string[] }
    neutral: { base: string; tones: string[] }
  }
  typography: {
    headline: TypographyLevel
    body: TypographyLevel
    label: TypographyLevel
  }
  components?: ComponentTokens
  guide?: DesignGuide
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AppInner />
      </I18nProvider>
    </ErrorBoundary>
  )
}

function AppInner() {
  const [view, setView] = useState<AppView>('dashboard')
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  useEffect(() => {
    designGuideDB.deleteAllSaved()
  }, [])

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project)
    setView('editor')
  }

  const handleBackToDashboard = () => {
    setView('dashboard')
    setCurrentProject(null)
  }

  const handleProjectUpdate = (updated: Project) => {
    setCurrentProject(updated)
  }

  if (view === 'settings') {
    return <Settings onBack={handleBackToDashboard} />
  }

  if (view === 'editor' && currentProject) {
    return (
      <Editor
        project={currentProject}
        onBack={handleBackToDashboard}
        onProjectUpdate={handleProjectUpdate}
        onOpenSettings={() => setView('settings')}
      />
    )
  }

  return (
    <Dashboard
      onOpenProject={handleOpenProject}
      onCreateProject={(prompt, deviceType, designSystem, colorScheme) => {
        const name = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt
        const ds = designSystem
          ? { ...designSystem, colorScheme: colorScheme || designSystem.colorScheme || 'auto' }
          : undefined
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          prompt,
          updatedAt: new Date().toLocaleDateString(),
          screens: [],
          deviceType,
          designSystem: ds,
        }
        handleOpenProject(project)
      }}
      onOpenSettings={() => setView('settings')}
    />
  )
}
