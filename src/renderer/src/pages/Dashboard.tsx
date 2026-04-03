import { useState } from 'react'
import type { Project } from '../App'
import { PromptBar } from '../components/common/PromptBar'
import { AppearanceToggle } from '../components/common/AppearanceToggle'

const EXAMPLE_PROJECTS: Project[] = [
  { id: 'ex1', name: 'Indoor Plant Care Dashboard', updatedAt: 'May 19, 2025' },
  { id: 'ex2', name: 'Alps skiing guide', updatedAt: 'May 19, 2025' },
  { id: 'ex3', name: 'Ceramic & Pottery Marketplace', updatedAt: 'May 19, 2025' },
  { id: 'ex4', name: 'Board game club planner', updatedAt: 'May 17, 2025' },
  { id: 'ex5', name: 'Homemade Pizza Cooking Elite Class', updatedAt: 'May 19, 2025' },
]

const PROMPT_SUGGESTIONS = [
  'A mobile leaderboard and stats page for a recreational kickball league called Sunday Rollers with a playful illustrated style',
  'Quiz page in a language learning app with a progress bar at the top',
  'Profile page for Formula One driver Max Verstappen, featuring pastel red as the primary color',
]

interface DashboardProps {
  onOpenProject: (project: Project) => void
  onCreateProject: (name: string) => void
  onOpenSettings?: () => void
}

export function Dashboard({ onOpenProject, onCreateProject, onOpenSettings }: DashboardProps) {
  const [recentProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deviceType, setDeviceType] = useState<'app' | 'web'>('app')

  const filteredExamples = EXAMPLE_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-13 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0 draggable">
        <div className="flex items-center gap-2 no-drag">
          <span className="text-xl font-bold tracking-tight">VibeSynth</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-600 text-neutral-500">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-2 no-drag">
          <AppearanceToggle />
          <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Settings">
            <SettingsIcon />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-56 border-r border-neutral-200 dark:border-neutral-700 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3">
            <div className="flex gap-1 mb-3">
              <button className="flex-1 text-sm font-medium px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                My projects
              </button>
            </div>
            <div className="relative mb-3">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <div className="px-3 mb-2">
              <p className="text-xs font-medium text-neutral-500 mb-1">Recent</p>
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm"
                >
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{project.updatedAt}</p>
                </button>
              ))}
            </div>
          )}

          {/* Examples */}
          <div className="px-3">
            <p className="text-xs font-medium text-neutral-500 mb-1">Examples</p>
            {filteredExamples.map((project) => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm"
              >
                <p className="font-medium truncate">{project.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{project.updatedAt}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-8">
          <h1 className="text-5xl font-light mb-8 tracking-tight">Welcome to VibeSynth.</h1>

          {/* Suggestion Chips */}
          <div className="flex gap-2 mb-6 flex-wrap justify-center max-w-2xl">
            {PROMPT_SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onCreateProject(suggestion)}
                className="px-4 py-2 text-sm rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 max-w-xs truncate"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="w-full max-w-2xl">
            <PromptBar
              placeholder={
                deviceType === 'app'
                  ? 'What native mobile app shall we design?'
                  : 'What desktop web experience shall we design?'
              }
              deviceType={deviceType}
              onDeviceTypeChange={setDeviceType}
              onSubmit={(prompt) => onCreateProject(prompt)}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}
