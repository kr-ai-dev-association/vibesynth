import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import { Settings } from './pages/Settings'

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

export interface DesignSystem {
  name: string
  colors: {
    primary: { base: string; tones: string[] }
    secondary: { base: string; tones: string[] }
    tertiary: { base: string; tones: string[] }
    neutral: { base: string; tones: string[] }
  }
  typography: {
    headline: { family: string }
    body: { family: string }
    label: { family: string }
  }
  guide?: DesignGuide
}

export default function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

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
      onCreateProject={(prompt, deviceType) => {
        const name = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          prompt,
          updatedAt: new Date().toLocaleDateString(),
          screens: [],
          deviceType,
        }
        handleOpenProject(project)
      }}
      onOpenSettings={() => setView('settings')}
    />
  )
}
