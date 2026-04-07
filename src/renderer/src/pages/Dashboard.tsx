import { useState, useRef, useEffect, useMemo } from 'react'
import type { Project, DesignSystem } from '../App'
import { PromptBar } from '../components/common/PromptBar'
import { AppearanceToggle } from '../components/common/AppearanceToggle'
import { PINTEREST_DESIGNS } from '../lib/pinterest-designs'
import { getExampleProjects, getExampleCategories, getSuggestions, type ExampleProject } from '../lib/example-projects'
import { useI18n } from '../lib/i18n'
import { MarkdownRenderer } from '../components/common/MarkdownRenderer'

interface DashboardProps {
  onOpenProject: (project: Project) => void
  onCreateProject: (name: string, deviceType: 'app' | 'web' | 'tablet', designSystem?: DesignSystem) => void
  onOpenSettings?: () => void
}

export function Dashboard({ onOpenProject, onCreateProject, onOpenSettings }: DashboardProps) {
  const { t, locale, setLocale } = useI18n()
  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  // Load saved projects from DB on mount
  useEffect(() => {
    window.electronAPI?.db.getAllProjects('default').then((saved: any[]) => {
      if (saved && saved.length > 0) {
        // Sort by updatedAt descending, take top 20
        const projects: Project[] = saved
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 20)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            prompt: p.prompt,
            updatedAt: p.updatedAt,
            screens: p.screens || [],
            deviceType: p.deviceType || 'app',
            designSystem: p.designSystem,
          }))
        setRecentProjects(projects)
      }
    }).catch(() => {})
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [deviceType, setDeviceType] = useState<'app' | 'web' | 'tablet'>('app')
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'auto'>('auto')
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'my' | 'shared'>('my')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [prdModal, setPrdModal] = useState<ExampleProject | null>(null)
  const [prdDesignId, setPrdDesignId] = useState<string | null>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const exampleProjects = useMemo(() => getExampleProjects(locale), [locale])
  const exampleCategories = useMemo(() => getExampleCategories(locale), [locale])
  const suggestions = useMemo(() => getSuggestions(locale), [locale])

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
    exampleProjects.filter((ex) =>
      ex.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery, exampleProjects]
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
      {/* Window drag bar */}
      <div className="h-3 shrink-0 draggable bg-white dark:bg-neutral-800" />
      {/* Header toolbar */}
      <header className="h-10 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">{t('common.appName')}</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-500">
            {t('common.beta')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title={locale === 'en' ? '한국어로 전환' : 'Switch to English'}
          >
            {locale === 'en' ? 'KO' : 'EN'}
          </button>
          <AppearanceToggle />
          <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" title={t('common.settings')}>
            <SettingsIcon />
          </button>
          <div ref={moreMenuRef} className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={t('common.more')}
            >
              <MoreVertIcon />
            </button>
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                <MoreMenuItem label={t('dashboard.helpFeedback')} onClick={() => setShowMoreMenu(false)} />
                <MoreMenuItem label={t('dashboard.keyboardShortcuts')} onClick={() => setShowMoreMenu(false)} />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MoreMenuItem label={t('dashboard.aboutApp')} onClick={() => setShowMoreMenu(false)} />
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
                {t('dashboard.myProjects')}
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
                {t('dashboard.sharedWithMe')}
              </button>
            </div>

            <div className="relative mb-3">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
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
                  <p className="text-[11px] font-medium text-neutral-400 mb-1.5 px-1">{t('dashboard.recent')}</p>
                  {recentProjects.map((project) => (
                    <SidebarProjectItem
                      key={project.id}
                      project={project}
                      onClick={() => onOpenProject(project)}
                      onDelete={() => {
                        window.electronAPI?.db.deleteProject(project.id)
                        setRecentProjects(prev => prev.filter(p => p.id !== project.id))
                      }}
                    />
                  ))}
                </div>
              )}

              {/* LifeFlow Examples by category */}
              <div className="px-3 pb-3">
                <p className="text-[11px] font-medium text-neutral-400 mb-1.5 px-1">
                  {t('dashboard.lifeflowExamples')}
                </p>
                {exampleCategories.map((cat) => {
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
              <p className="text-sm text-neutral-400">{t('dashboard.noShared')}</p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-8">
          <h1 className="text-5xl font-light mb-8 tracking-tight">{t('dashboard.welcome')}</h1>

          {/* Example Cards — LifeFlow showcase */}
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-3xl w-full">
            {exampleProjects.map((ex) => (
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
            {suggestions.map((suggestion, i) => (
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
          <div className="w-full max-w-3xl">
            <PromptBar
              placeholder={
                deviceType === 'app'
                  ? t('dashboard.promptApp')
                  : deviceType === 'tablet'
                  ? t('dashboard.promptTablet')
                  : t('dashboard.promptWeb')
              }
              deviceType={deviceType}
              onDeviceTypeChange={setDeviceType}
              colorScheme={colorScheme}
              onColorSchemeChange={setColorScheme}
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
  const { t } = useI18n()
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
              <p className="text-xs text-neutral-400 mb-2">{t('dashboard.designStyle')}</p>
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
              {t('common.generate')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Subcomponents ────────────────────────────────────────────

function SidebarProjectItem({ project, onClick, onDelete }: { project: Project; onClick: () => void; onDelete?: () => void }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2.5 px-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
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
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-all"
          title="Delete project"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  )
}

function DesignSystemPicker({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="w-full max-w-3xl mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors mx-auto"
        data-testid="design-system-picker-toggle"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
        {selectedId ? (
          <span>{t('dashboard.stylePrefix')}<strong className="text-neutral-600 dark:text-neutral-200">{PINTEREST_DESIGNS.find(d => d.id === selectedId)?.name}</strong></span>
        ) : (
          <span>{t('dashboard.chooseDesignStyle')}</span>
        )}
        <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 w-full" data-testid="design-system-picker-grid">
          <button
            onClick={() => { onSelect(null); setExpanded(false) }}
            className={`rounded-xl border-2 transition-all p-1.5 ${
              !selectedId ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
            }`}
            title={t('dashboard.autoAI')}
          >
            <div className="flex h-3 rounded overflow-hidden bg-neutral-200 dark:bg-neutral-600">
              <div className="flex-1 bg-neutral-300 dark:bg-neutral-500" />
              <div className="flex-1 bg-neutral-200 dark:bg-neutral-600" />
            </div>
            <div className="text-[8px] text-neutral-400 mt-1 truncate text-center">{t('dashboard.auto')}</div>
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
