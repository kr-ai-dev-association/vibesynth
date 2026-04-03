import { useState, useRef, useEffect } from 'react'
import type { Project } from '../App'
import { PromptBar } from '../components/common/PromptBar'
import { AppearanceToggle } from '../components/common/AppearanceToggle'

interface ExampleThumbnail {
  gradient: string
  emoji: string
}

const EXAMPLE_THUMBNAILS: Record<string, ExampleThumbnail> = {
  ex1: { gradient: 'linear-gradient(135deg, #0d1117 0%, #1a3a1a 50%, #CCFF00 100%)', emoji: '🌿' },
  ex2: { gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', emoji: '🚀' },
  ex3: { gradient: 'linear-gradient(135deg, #FFF8E1 0%, #D7CCC8 50%, #C75B39 100%)', emoji: '🏺' },
  ex4: { gradient: 'linear-gradient(135deg, #E8F5E9 0%, #66BB6A 50%, #2E7D32 100%)', emoji: '📖' },
  ex5: { gradient: 'linear-gradient(135deg, #1a1a1a 0%, #8B0000 50%, #E53935 100%)', emoji: '🍕' },
}

const EXAMPLE_PROJECTS: Project[] = [
  {
    id: 'ex1',
    name: 'Indoor Plant Care Dashboard',
    prompt: 'A mobile app dashboard for tracking indoor plants. Show a dark themed home screen with plant health stats (total plants, need water, health score), a list of plants with emoji icons, watering schedule status, and a bottom navigation bar. Use neon green (#CCFF00) as the accent color on dark background.',
    updatedAt: 'May 19, 2025',
    screens: [],
    deviceType: 'app',
  },
  {
    id: 'ex2',
    name: 'SaaS Startup Landing Page',
    prompt: 'A modern SaaS startup landing page for a project management tool. Include a bold hero section with headline, subheading, CTA buttons ("Start Free Trial", "Watch Demo"), a floating dashboard mockup preview. Below: feature cards in a 3-column grid (Task boards, Time tracking, Team chat), testimonial carousel, pricing table (Free/Pro/Enterprise tiers), and a dark footer with newsletter signup. Use a deep indigo-to-purple gradient (#302b63 to #24243e) hero with white text and bright cyan (#00E5FF) accent buttons. Sticky top navigation with logo, nav links (Features, Pricing, About), and Sign In / Get Started buttons.',
    updatedAt: 'May 19, 2025',
    screens: [],
    deviceType: 'web',
  },
  {
    id: 'ex3',
    name: 'Ceramic & Pottery Marketplace',
    prompt: 'A desktop web marketplace for handmade ceramics and pottery. Show a browse page with a search bar, filter chips (Bowls, Vases, Plates, Mugs, Sculptures), a grid of product cards with price tags, artisan names, and star ratings. Use warm earthy tones — terracotta (#C75B39) primary, cream background, elegant serif headings. Include a top nav with logo, categories, cart icon, and user avatar.',
    updatedAt: 'May 19, 2025',
    screens: [],
    deviceType: 'web',
  },
  {
    id: 'ex4',
    name: 'Digital Magazine Reader',
    prompt: 'A tablet reading app for a digital magazine (1024px width, portrait). Show a content browsing screen with a large featured article hero card with image placeholder (gradient), headline and author. Below: a two-column grid of article cards with thumbnails, category tags (Tech, Design, Culture, Science), read time estimates, and bookmark icons. Include a left sidebar with magazine sections (Home, Trending, Saved, Settings) and a top bar with search and user avatar. Use rich green (#2E7D32) as primary with an elegant serif headline font feel. Clean white background with subtle card shadows.',
    updatedAt: 'May 17, 2025',
    screens: [],
    deviceType: 'tablet',
  },
  {
    id: 'ex5',
    name: 'Homemade Pizza Cooking Elite Class',
    prompt: 'A mobile app for a premium pizza cooking class. Show a lesson detail screen with a large hero area for the pizza photo (use a warm gradient placeholder), lesson title "Neapolitan Margherita", instructor info, ingredient list with checkboxes, step-by-step instructions preview, and a "Start Cooking" CTA button. Use warm red (#E53935) as primary with Italian-inspired design, dark mode. Include a progress bar showing "Lesson 3 of 8".',
    updatedAt: 'May 19, 2025',
    screens: [],
    deviceType: 'app',
  },
]

const PROMPT_SUGGESTIONS = [
  'A recipe discovery app for making cocktails at home with step-by-step guides',
  'A browse tab for a mobile app for romantic travel destinations',
  'Mobile home screen for a fitness tracking app with dark theme',
]

interface DashboardProps {
  onOpenProject: (project: Project) => void
  onCreateProject: (name: string, deviceType: 'app' | 'web' | 'tablet') => void
  onOpenSettings?: () => void
}

export function Dashboard({ onOpenProject, onCreateProject, onOpenSettings }: DashboardProps) {
  const [recentProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deviceType, setDeviceType] = useState<'app' | 'web' | 'tablet'>('app')
  const [sidebarTab, setSidebarTab] = useState<'my' | 'shared'>('my')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredExamples = EXAMPLE_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header — matches Stitch: logo left, icons right */}
      <header className="h-13 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0 draggable">
        <div className="flex items-center gap-2 no-drag">
          <span className="text-xl font-bold tracking-tight">VibeSynth</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-500">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          <AppearanceToggle />
          <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Settings">
            <SettingsIcon />
          </button>
          <div ref={moreMenuRef} className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="More"
            >
              <MoreVertIcon />
            </button>
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                <MoreMenuItem label="Help & feedback" onClick={() => setShowMoreMenu(false)} />
                <MoreMenuItem label="Keyboard shortcuts" onClick={() => setShowMoreMenu(false)} />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MoreMenuItem label="About VibeSynth" onClick={() => setShowMoreMenu(false)} />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Stitch-style: tabs, thumbnails, date groups */}
        <aside className="w-60 border-r border-neutral-200 dark:border-neutral-700 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3">
            {/* Tabs: My projects / Shared with me */}
            <div className="flex gap-0 mb-3 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <button
                onClick={() => setSidebarTab('my')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 transition-colors ${
                  sidebarTab === 'my'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <GridIcon className="w-3.5 h-3.5" />
                My projects
              </button>
              <button
                onClick={() => setSidebarTab('shared')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 transition-colors ${
                  sidebarTab === 'shared'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <PeopleIcon className="w-3.5 h-3.5" />
                Shared with me
              </button>
            </div>

            {/* Search */}
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

          {sidebarTab === 'my' ? (
            <>
              {/* Recent Projects — grouped by date like Stitch */}
              {recentProjects.length > 0 && (
                <div className="px-3 mb-2">
                  <p className="text-[11px] font-medium text-neutral-400 mb-1.5 px-1">Yesterday</p>
                  {recentProjects.map((project) => (
                    <ProjectItem key={project.id} project={project} onClick={() => onOpenProject(project)} />
                  ))}
                </div>
              )}

              {/* Examples — with thumbnails */}
              <div className="px-3 pb-3">
                <p className="text-[11px] font-medium text-neutral-400 mb-1.5 px-1">Examples</p>
                {filteredExamples.map((project) => (
                  <ProjectItem key={project.id} project={project} onClick={() => onOpenProject(project)} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center px-6 text-center">
              <p className="text-sm text-neutral-400">No shared projects yet</p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-8">
          <h1 className="text-5xl font-light mb-8 tracking-tight">Welcome to VibeSynth.</h1>

          {/* Suggestion Chips */}
          <div className="flex gap-2 mb-6 flex-wrap justify-center max-w-2xl">
            {PROMPT_SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onCreateProject(suggestion, deviceType)}
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
                  : deviceType === 'tablet'
                  ? 'What tablet experience shall we design?'
                  : 'What desktop web experience shall we design?'
              }
              deviceType={deviceType}
              onDeviceTypeChange={setDeviceType}
              onSubmit={(prompt) => onCreateProject(prompt, deviceType)}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

function ProjectItem({ project, onClick }: { project: Project; onClick: () => void }) {
  const hasScreens = project.screens.length > 0
  const thumb = EXAMPLE_THUMBNAILS[project.id]

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left group"
    >
      {/* Thumbnail */}
      <div className="w-8 h-8 rounded-md shrink-0 overflow-hidden border border-neutral-200 dark:border-neutral-700">
        {hasScreens ? (
          <iframe
            srcDoc={project.screens[0].html}
            title={project.name}
            className="pointer-events-none"
            style={{ width: 390, height: 844, transform: 'scale(0.0205)', transformOrigin: '0 0', border: 'none' }}
          />
        ) : thumb ? (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{ background: thumb.gradient }}
          >
            {thumb.emoji}
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{ background: project.deviceType === 'web' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #a3a3a3, #737373)' }}
          >
            {project.deviceType === 'web' ? '🌐' : '📱'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-neutral-900 dark:group-hover:text-white">{project.name}</p>
        <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
          {project.deviceType === 'web' ? <MonitorTinyIcon /> : project.deviceType === 'tablet' ? <TabletTinyIcon /> : <PhoneTinyIcon />}
          {project.updatedAt}
        </p>
      </div>
    </button>
  )
}

function MoreMenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
    >
      {label}
    </button>
  )
}

// Icons
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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
  )
}
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
  )
}
function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
  )
}
function MoreVertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
  )
}
function PhoneTinyIcon() {
  return <svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
}
function TabletTinyIcon() {
  return <svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M12 18h.01" /></svg>
}
function MonitorTinyIcon() {
  return <svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
}
