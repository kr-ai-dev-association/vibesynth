import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'

export type AppView = 'dashboard' | 'editor'

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
    />
  )
}
