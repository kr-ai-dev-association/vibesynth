import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import { Settings } from './pages/Settings'

export type AppView = 'dashboard' | 'editor' | 'settings'

export interface Project {
  id: string
  name: string
  updatedAt: string
  thumbnail?: string
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

  if (view === 'settings') {
    return <Settings onBack={handleBackToDashboard} />
  }

  if (view === 'editor' && currentProject) {
    return (
      <Editor
        project={currentProject}
        onBack={handleBackToDashboard}
      />
    )
  }

  return (
    <Dashboard
      onOpenProject={handleOpenProject}
      onCreateProject={(name) => {
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          updatedAt: new Date().toLocaleDateString(),
        }
        handleOpenProject(project)
      }}
      onOpenSettings={() => setView('settings')}
    />
  )
}
