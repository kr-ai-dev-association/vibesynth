import { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import { Settings } from './pages/Settings'
import { designGuideDB } from './lib/design-guide-db'
import { I18nProvider } from './lib/i18n'

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
    <I18nProvider>
      <AppInner />
    </I18nProvider>
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
      onCreateProject={(prompt, deviceType, designSystem) => {
        const name = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          prompt,
          updatedAt: new Date().toLocaleDateString(),
          screens: [],
          deviceType,
          designSystem,
        }
        handleOpenProject(project)
      }}
      onOpenSettings={() => setView('settings')}
    />
  )
}
