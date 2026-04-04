import { useState, useRef, useEffect, useMemo } from 'react'
import type { Project, DesignSystem } from '../App'
import { PromptBar } from '../components/common/PromptBar'
import { AppearanceToggle } from '../components/common/AppearanceToggle'
import { PINTEREST_DESIGNS } from '../lib/pinterest-designs'
import { EXAMPLE_PROJECTS, EXAMPLE_CATEGORIES, type ExampleProject } from '../lib/example-projects'

const PROMPT_SUGGESTIONS = [
  'A recipe discovery app for making cocktails at home with step-by-step guides',
  'A browse tab for a mobile app for romantic travel destinations',
  'Mobile home screen for a fitness tracking app with dark theme',
]

interface DashboardProps {
  onOpenProject: (project: Project) => void
  onCreateProject: (name: string, deviceType: 'app' | 'web' | 'tablet', designSystem?: DesignSystem) => void
  onOpenSettings?: () => void
}

export function Dashboard({ onOpenProject, onCreateProject, onOpenSettings }: DashboardProps) {
  const [recentProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deviceType, setDeviceType] = useState<'app' | 'web' | 'tablet'>('app')
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'my' | 'shared'>('my')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [prdModal, setPrdModal] = useState<ExampleProject | null>(null)
  const [prdDesignId, setPrdDesignId] = useState<string | null>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const selectedDesignSystem = selectedDesignId
    ? PINTEREST_DESIGNS.find(d => d.id === selectedDesignId)?.designSystem
    : undefined

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredExamples = useMemo(() =>
    EXAMPLE_PROJECTS.filter((ex) =>
      ex.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  )

  const handleOpenExample = (ex: ExampleProject) => {
    setPrdDesignId(ex.recommendedDesignId)
    setPrdModal(ex)
  }

  const handleGenerateFromPrd = () => {
    if (!prdModal) return
    const ds = prdDesignId
      ? PINTEREST_DESIGNS.find(d => d.id === prdDesignId)?.designSystem
      : undefined
    const project = ds ? { ...prdModal.project, designSystem: ds } : prdModal.project
    setPrdModal(null)
    onOpenProject(project)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
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
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-neutral-200 dark:border-neutral-700 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3">
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
              {recentProjects.length > 0 && (
                <div className="px-3 mb-2">
                  <p className="text-[11px] font-medium text-neutral-400 mb-1.5 px-1">Recent</p>
                  {recentProjects.map((project) => (
                    <SidebarProjectItem key={project.id} project={project} onClick={() => onOpenProject(project)} />
                  ))}
                </div>
              )}

              {/* LifeFlow Examples by category */}
              <div className="px-3 pb-3">
                <p className="text-[11px] font-medium text-neutral-400 mb-1.5 px-1">
                  LifeFlow Examples
                </p>
                {EXAMPLE_CATEGORIES.map((cat) => {
                  const ex = filteredExamples.find(e => e.category === cat.id)
                  if (!ex) return null
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleOpenExample(ex)}
                      className="w-full flex items-center gap-2.5 px-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left group"
                    >
                      <div
                        className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-sm border border-neutral-200 dark:border-neutral-700"
                        style={{ background: ex.gradient }}
                      >
                        {ex.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate group-hover:text-neutral-900 dark:group-hover:text-white">
                          {ex.project.name}
                        </p>
                        <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <DeviceIcon type={ex.project.deviceType} />
                          {ex.categoryLabel}
                        </p>
                      </div>
                    </button>
                  )
                })}
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

          {/* Example Cards — LifeFlow showcase */}
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-3xl w-full">
            {EXAMPLE_PROJECTS.map((ex) => (
              <button
                key={ex.project.id}
                onClick={() => handleOpenExample(ex)}
                className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-500 transition-all hover:shadow-lg text-left"
              >
                <div className="h-20 relative" style={{ background: ex.gradient }}>
                  <span className="absolute bottom-2 right-2 text-2xl drop-shadow-md">{ex.emoji}</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold truncate">{ex.project.name}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                    <DeviceIcon type={ex.project.deviceType} />
                    {ex.categoryLabel}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Suggestion Chips */}
          <div className="flex gap-2 mb-4 flex-wrap justify-center max-w-2xl">
            {PROMPT_SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onCreateProject(suggestion, deviceType, selectedDesignSystem)}
                className="px-4 py-2 text-sm rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 max-w-xs truncate"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Design System Picker */}
          <DesignSystemPicker
            selectedId={selectedDesignId}
            onSelect={setSelectedDesignId}
          />

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
              onSubmit={(prompt) => onCreateProject(prompt, deviceType, selectedDesignSystem)}
            />
          </div>
        </main>
      </div>

      {/* PRD Modal */}
      {prdModal && (
        <PrdModal
          example={prdModal}
          selectedDesignId={prdDesignId}
          onSelectDesign={setPrdDesignId}
          onGenerate={handleGenerateFromPrd}
          onClose={() => setPrdModal(null)}
        />
      )}
    </div>
  )
}

// ─── PRD Modal ────────────────────────────────────────────────

function PrdModal({
  example,
  selectedDesignId,
  onSelectDesign,
  onGenerate,
  onClose,
}: {
  example: ExampleProject
  selectedDesignId: string | null
  onSelectDesign: (id: string | null) => void
  onGenerate: () => void
  onClose: () => void
}) {
  const selectedDS = selectedDesignId
    ? PINTEREST_DESIGNS.find(d => d.id === selectedDesignId)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[900px] max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: example.gradient }}
            >
              {example.emoji}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{example.project.name}</h2>
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <DeviceIcon type={example.project.deviceType} />
                {example.categoryLabel}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <MarkdownRenderer content={example.prd} />
        </div>

        {/* Footer — Design System Selector + Generate */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* DS Selector */}
            <div className="flex-1">
              <p className="text-xs text-neutral-400 mb-2">Design Style</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {PINTEREST_DESIGNS.slice(0, 8).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onSelectDesign(d.id === selectedDesignId ? null : d.id)}
                    className={`shrink-0 rounded-xl border-2 transition-all p-1.5 w-16 ${
                      selectedDesignId === d.id
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                    title={d.name}
                  >
                    <div className="flex h-2.5 rounded overflow-hidden">
                      <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.primary.base }} />
                      <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.secondary.base }} />
                      <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.tertiary.base }} />
                    </div>
                    <div className="text-[7px] text-neutral-400 mt-0.5 truncate text-center">{d.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              className="shrink-0 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {selectedDS && (
                <div className="flex h-3 w-8 rounded overflow-hidden">
                  <div className="flex-1" style={{ backgroundColor: selectedDS.designSystem.colors.primary.base }} />
                  <div className="flex-1" style={{ backgroundColor: selectedDS.designSystem.colors.secondary.base }} />
                </div>
              )}
              Generate
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Simple Markdown Renderer ─────────────────────────────────

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let tableRows: string[][] = []
  let inTable = false
  let key = 0

  const flushTable = () => {
    if (tableRows.length < 2) { tableRows = []; return }
    const headers = tableRows[0]
    const rows = tableRows.slice(2) // skip separator
    elements.push(
      <div key={key++} className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="text-left px-3 py-2 border-b-2 border-neutral-200 dark:border-neutral-600 font-semibold text-neutral-700 dark:text-neutral-200 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-neutral-100 dark:border-neutral-700/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableRows = []
  }

  const inlineFormat = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    let remaining = text
    let idx = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index))
        parts.push(<strong key={`b${idx++}`} className="font-semibold text-neutral-800 dark:text-neutral-100">{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      } else {
        parts.push(remaining)
        break
      }
    }
    return parts
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) inTable = true
      const cells = line.split('|').slice(1, -1).map(c => c.trim())
      tableRows.push(cells)
      continue
    } else if (inTable) {
      inTable = false
      flushTable()
    }

    // Empty line
    if (!line.trim()) {
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-2xl font-bold mt-1 mb-3 text-neutral-900 dark:text-white">{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-lg font-bold mt-5 mb-2 text-neutral-800 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-sm font-bold mt-4 mb-1.5 text-neutral-700 dark:text-neutral-200">{line.slice(4)}</h3>)
    }
    // List items
    else if (line.match(/^\s*[-*]\s/)) {
      const indent = line.search(/\S/)
      const text = line.replace(/^\s*[-*]\s/, '')
      elements.push(
        <div key={key++} className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed" style={{ paddingLeft: Math.max(0, indent * 4) + 'px' }}>
          <span className="text-neutral-300 dark:text-neutral-500 mt-0.5">•</span>
          <span>{inlineFormat(text)}</span>
        </div>
      )
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\.\s/)![1]
      const text = line.replace(/^\d+\.\s/, '')
      elements.push(
        <div key={key++} className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <span className="text-neutral-400 dark:text-neutral-500 font-medium w-4 shrink-0 text-right">{num}.</span>
          <span>{inlineFormat(text)}</span>
        </div>
      )
    }
    // Regular paragraph
    else {
      elements.push(<p key={key++} className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-1">{inlineFormat(line)}</p>)
    }
  }

  if (inTable) flushTable()

  return <div className="space-y-0.5">{elements}</div>
}

// ─── Subcomponents ────────────────────────────────────────────

function SidebarProjectItem({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left group"
    >
      <div className="w-8 h-8 rounded-md shrink-0 overflow-hidden border border-neutral-200 dark:border-neutral-700">
        <div
          className="w-full h-full flex items-center justify-center text-sm"
          style={{ background: project.deviceType === 'web' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #a3a3a3, #737373)' }}
        >
          {project.deviceType === 'web' ? '🌐' : project.deviceType === 'tablet' ? '📋' : '📱'}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-neutral-900 dark:group-hover:text-white">{project.name}</p>
        <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
          <DeviceIcon type={project.deviceType} />
          {project.updatedAt}
        </p>
      </div>
    </button>
  )
}

function DesignSystemPicker({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="w-full max-w-2xl mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors mx-auto"
        data-testid="design-system-picker-toggle"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
        {selectedId ? (
          <span>Style: <strong className="text-neutral-600 dark:text-neutral-200">{PINTEREST_DESIGNS.find(d => d.id === selectedId)?.name}</strong></span>
        ) : (
          <span>Choose a design style (optional)</span>
        )}
        <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 max-w-2xl" data-testid="design-system-picker-grid">
          <button
            onClick={() => { onSelect(null); setExpanded(false) }}
            className={`rounded-xl border-2 transition-all p-1.5 ${
              !selectedId ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
            }`}
            title="Auto (AI decides)"
          >
            <div className="flex h-3 rounded overflow-hidden bg-neutral-200 dark:bg-neutral-600">
              <div className="flex-1 bg-neutral-300 dark:bg-neutral-500" />
              <div className="flex-1 bg-neutral-200 dark:bg-neutral-600" />
            </div>
            <div className="text-[8px] text-neutral-400 mt-1 truncate text-center">Auto</div>
          </button>

          {PINTEREST_DESIGNS.map((d) => (
            <button
              key={d.id}
              data-testid={`ds-pick-${d.id}`}
              onClick={() => { onSelect(d.id === selectedId ? null : d.id); setExpanded(false) }}
              className={`rounded-xl border-2 transition-all p-1.5 ${
                selectedId === d.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
              }`}
              title={d.name}
            >
              <div className="flex h-3 rounded overflow-hidden">
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.primary.base }} />
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.secondary.base }} />
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.tertiary.base }} />
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.neutral.base }} />
              </div>
              <div className="text-[8px] text-neutral-500 dark:text-neutral-400 mt-1 truncate text-center">{d.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
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

function DeviceIcon({ type }: { type: 'app' | 'web' | 'tablet' }) {
  if (type === 'web') return <MonitorTinyIcon />
  if (type === 'tablet') return <TabletTinyIcon />
  return <PhoneTinyIcon />
}

// ─── Icons ────────────────────────────────────────────────────

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
