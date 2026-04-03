import { useState, useRef, useCallback, useEffect } from 'react'
import type { Project, Screen, DesignSystem } from '../App'
import { PromptBar } from '../components/common/PromptBar'
import { AppearanceToggle } from '../components/common/AppearanceToggle'
import { AgentLog } from '../components/editor/AgentLog'
import { ScreenContextToolbar, ScreenContextMenu } from '../components/editor/ScreenContextToolbar'
import { RightPanel } from '../components/editor/RightPanel'
import { generateDesign, editDesign, generateDesignSystem } from '../lib/gemini'
import { DEFAULT_DESIGN_GUIDE } from '../lib/default-design-guide'

export interface AgentLogEntry {
  id: string
  message: string
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'generating'
}

interface EditorProps {
  project: Project
  onBack: () => void
  onProjectUpdate: (project: Project) => void
  onOpenSettings?: () => void
}

const PLACEHOLDER_DESIGN_SYSTEM: DesignSystem = {
  name: 'Generating...',
  colors: {
    primary: { base: '#d4d4d4', tones: Array(12).fill('#e5e5e5') },
    secondary: { base: '#d4d4d4', tones: Array(12).fill('#e5e5e5') },
    tertiary: { base: '#d4d4d4', tones: Array(12).fill('#e5e5e5') },
    neutral: { base: '#d4d4d4', tones: Array(12).fill('#e5e5e5') },
  },
  typography: {
    headline: { family: '...' },
    body: { family: '...' },
    label: { family: '...' },
  },
}

export function Editor({ project, onBack, onProjectUpdate, onOpenSettings }: EditorProps) {
  const [zoom, setZoom] = useState(100)
  const [isRunning, setIsRunning] = useState(false)
  const [showHamburger, setShowHamburger] = useState(false)
  const [deviceType, setDeviceType] = useState<'app' | 'web' | 'tablet'>(project.deviceType)
  const [agentLogOpen, setAgentLogOpen] = useState(true)
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [logEntries, setLogEntries] = useState<AgentLogEntry[]>([])
  const [showCodeModal, setShowCodeModal] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Canvas pan state
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })

  const designSystem = project.designSystem || PLACEHOLDER_DESIGN_SYSTEM

  // Auto-generate initial screen if project has no screens (just created from dashboard)
  const initialGenerationDone = useRef(false)
  useEffect(() => {
    if (project.screens.length === 0 && !initialGenerationDone.current) {
      initialGenerationDone.current = true
      handleGenerateScreen(project.prompt || project.name)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for live window close events from main process
  useEffect(() => {
    const cleanup = window.electronAPI?.onLiveWindowClosed(() => {
      setIsRunning(false)
    })
    return () => cleanup?.()
  }, [])

  // Sync current screen HTML to live window when screens update
  useEffect(() => {
    if (!isRunning) return
    const screen = selectedScreen
      ? project.screens.find((s) => s.name === selectedScreen)
      : project.screens[0]
    if (screen) {
      window.electronAPI?.updateLiveWindow(screen.html)
    }
  }, [project.screens, selectedScreen, isRunning])

  const addLog = (message: string, type: AgentLogEntry['type'] = 'info') => {
    const entry: AgentLogEntry = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date(),
      type,
    }
    setLogEntries((prev) => [...prev, entry])
    return entry.id
  }

  const updateLog = (id: string, message: string, type: AgentLogEntry['type']) => {
    setLogEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, message, type } : e))
    )
  }

  const activeGuide = project.designSystem?.guide || DEFAULT_DESIGN_GUIDE

  const handleGenerateScreen = async (prompt: string) => {
    if (isGenerating) return
    setIsGenerating(true)
    setAgentLogOpen(true)

    const logId = addLog(`Generating design: "${prompt}"...`, 'generating')

    try {
      const results = await generateDesign(prompt, deviceType, activeGuide)
      const newScreens: Screen[] = results.map((r) => ({
        id: crypto.randomUUID(),
        name: r.screenName,
        html: r.html,
      }))

      updateLog(logId, `Generated screen: ${newScreens[0].name}`, 'success')

      if (!project.designSystem && newScreens[0]) {
        const dsLogId = addLog('Extracting design system & guide...', 'generating')
        try {
          const ds = await generateDesignSystem(newScreens[0].html, activeGuide)
          updateLog(dsLogId, `Design system "${ds.name}" with guide extracted`, 'success')
          onProjectUpdate({
            ...project,
            screens: [...project.screens, ...newScreens],
            designSystem: ds,
            updatedAt: new Date().toLocaleDateString(),
          })
        } catch {
          updateLog(dsLogId, 'Could not extract design system', 'error')
          onProjectUpdate({
            ...project,
            screens: [...project.screens, ...newScreens],
            updatedAt: new Date().toLocaleDateString(),
          })
        }
      } else {
        onProjectUpdate({
          ...project,
          screens: [...project.screens, ...newScreens],
          updatedAt: new Date().toLocaleDateString(),
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateLog(logId, `Generation failed: ${message}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditScreen = async (prompt: string) => {
    if (isGenerating || !selectedScreen) return

    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return

    setIsGenerating(true)
    setAgentLogOpen(true)

    const logId = addLog(`Editing "${screen.name}": "${prompt}"...`, 'generating')

    try {
      const newHtml = await editDesign(screen.html, prompt)
      updateLog(logId, `Updated screen: ${screen.name}`, 'success')

      const updatedScreens = project.screens.map((s) =>
        s.id === screen.id ? { ...s, html: newHtml } : s
      )
      onProjectUpdate({
        ...project,
        screens: updatedScreens,
        updatedAt: new Date().toLocaleDateString(),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateLog(logId, `Edit failed: ${message}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePromptSubmit = (prompt: string) => {
    if (selectedScreen && project.screens.some((s) => s.name === selectedScreen)) {
      handleEditScreen(prompt)
    } else {
      handleGenerateScreen(prompt)
    }
  }

  const handleRegenerateScreen = async () => {
    if (!selectedScreen || isGenerating) return
    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return

    setIsGenerating(true)
    setAgentLogOpen(true)
    const logId = addLog(`Regenerating "${screen.name}"...`, 'generating')

    try {
      const results = await generateDesign(screen.name, deviceType)
      if (results[0]) {
        updateLog(logId, `Regenerated: ${screen.name}`, 'success')
        const updatedScreens = project.screens.map((s) =>
          s.id === screen.id ? { ...s, html: results[0].html } : s
        )
        onProjectUpdate({ ...project, screens: updatedScreens, updatedAt: new Date().toLocaleDateString() })
      }
    } catch (err) {
      updateLog(logId, `Regenerate failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDuplicateScreen = () => {
    if (!selectedScreen) return
    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return
    const dup: Screen = { id: crypto.randomUUID(), name: `${screen.name} (copy)`, html: screen.html }
    onProjectUpdate({ ...project, screens: [...project.screens, dup], updatedAt: new Date().toLocaleDateString() })
    addLog(`Duplicated "${screen.name}"`, 'success')
  }

  const handleDeleteScreen = () => {
    if (!selectedScreen) return
    const updated = project.screens.filter((s) => s.name !== selectedScreen)
    onProjectUpdate({ ...project, screens: updated, updatedAt: new Date().toLocaleDateString() })
    addLog(`Deleted "${selectedScreen}"`, 'info')
    setSelectedScreen(null)
  }

  const handleScreenAction = (action: string) => {
    setContextMenu(null)

    switch (action) {
      case 'regenerate':
        handleRegenerateScreen()
        break
      case 'duplicate':
        handleDuplicateScreen()
        break
      case 'delete':
        handleDeleteScreen()
        break
      case 'view-code': {
        setShowCodeModal(true)
        break
      }
      case 'copy-code': {
        const screen = project.screens.find((s) => s.name === selectedScreen)
        if (screen) {
          navigator.clipboard.writeText(screen.html)
          addLog(`Copied code for "${screen.name}"`, 'success')
        }
        break
      }
      case 'copy-png':
        addLog('Copy as PNG — coming soon', 'info')
        break
      case 'run-popup':
        if (!isRunning) handleRun()
        break
      case 'run-browser':
      case 'open-browser': {
        const screen = project.screens.find((s) => s.name === selectedScreen)
        if (screen) {
          const blob = new Blob([screen.html], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
        }
        break
      }
      case 'device-mobile':
        window.electronAPI?.setLiveWindowSize(420, 900)
        addLog('Switched to Mobile frame (390×884)', 'info')
        break
      case 'device-tablet':
        window.electronAPI?.setLiveWindowSize(800, 1060)
        addLog('Switched to Tablet frame (768×1024)', 'info')
        break
      case 'device-desktop':
        window.electronAPI?.setLiveWindowSize(1320, 1060)
        addLog('Switched to Desktop frame (1280×1024)', 'info')
        break
      case 'always-on-top':
        window.electronAPI?.setLiveWindowAlwaysOnTop(true)
        addLog('Live window: always on top', 'info')
        break
      case 'variations':
        addLog('Variations — coming soon', 'info')
        break
      case 'desktop-web':
        addLog('Desktop web version — coming soon', 'info')
        break
      case 'heatmap':
        addLog('Predictive heatmap — coming soon', 'info')
        break
      case 'edit':
        break
      case 'annotate':
        addLog('Annotate — coming soon', 'info')
        break
      case 'design-system':
        addLog('Design system editor — coming soon', 'info')
        break
      case 'download':
        addLog('Download — coming soon', 'info')
        break
      case 'copy':
      case 'copy-as':
      case 'cut':
      case 'focus':
      case 'favourite':
      case 'open-editor':
      case 'devtools':
        addLog(`${action} — coming soon`, 'info')
        break
      default:
        break
    }
  }

  const spaceHeld = useRef(false)
  const [spaceDown, setSpaceDown] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        spaceHeld.current = true
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false
        setSpaceDown(false)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isMiddle = e.button === 1
    const isLeftWithMod = e.button === 0 && (e.altKey || spaceHeld.current)
    const isLeftOnEmptyCanvas = e.button === 0 && !(e.target as HTMLElement).closest('[data-screen-card]')

    if (isMiddle || isLeftWithMod || isLeftOnEmptyCanvas) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
    }
  }, [isPanning])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom((z) => Math.max(10, Math.min(400, z - e.deltaY * 0.5)))
    }
  }, [])

  const handleRun = () => {
    if (!isRunning) {
      const screen = selectedScreen
        ? project.screens.find((s) => s.name === selectedScreen)
        : project.screens[0]
      window.electronAPI?.openLiveWindow(screen?.html)
      setIsRunning(true)
    } else {
      window.electronAPI?.closeLiveWindow()
      setIsRunning(false)
    }
  }

  const screenWidth = deviceType === 'app' ? 390 : deviceType === 'tablet' ? 1024 : 1280
  const screenHeight = deviceType === 'app' ? 844 : deviceType === 'tablet' ? 1366 : 800
  const selectedScreenObj = selectedScreen ? project.screens.find((s) => s.name === selectedScreen) : null

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-3 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shrink-0 draggable">
        <div className="flex items-center gap-2 no-drag">
          {/* Hamburger */}
          <div className="relative">
            <button
              onClick={() => setShowHamburger(!showHamburger)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            {showHamburger && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                <MenuItem icon="←" label="Go to all projects" onClick={() => { setShowHamburger(false); onBack() }} />
                <MenuItem icon="📁" label="Open project folder" onClick={() => setShowHamburger(false)} />
                <MenuItem icon="📝" label="Open in external editor" onClick={() => setShowHamburger(false)} />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MenuItem icon="🎨" label="Appearance" onClick={() => {
                  setShowHamburger(false)
                  const root = document.documentElement
                  if (root.classList.contains('dark')) {
                    root.classList.remove('dark')
                    localStorage.setItem('vibesynth-theme', 'light')
                  } else {
                    root.classList.add('dark')
                    localStorage.setItem('vibesynth-theme', 'dark')
                  }
                }} />
                <MenuItem icon="⚙" label="Settings" onClick={() => { setShowHamburger(false); onOpenSettings?.() }} />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MenuItem icon="⌘" label="Command menu" shortcut="⌘K" onClick={() => setShowHamburger(false)} />
              </div>
            )}
          </div>

          <span className="text-sm font-medium">{project.name}</span>

          {isGenerating && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <LoadingSpinner />
              Generating...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 no-drag">
          {/* Run/Stop button */}
          <button
            onClick={handleRun}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg ${
              isRunning
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200'
            }`}
          >
            {isRunning ? '■ Stop' : '▶ Run'}
          </button>

          <AppearanceToggle />

          <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Settings">
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Screen context toolbar - shown when a screen is selected */}
        {selectedScreen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1 z-40">
            <ScreenContextToolbar
              screenName={selectedScreen}
              onAction={handleScreenAction}
            />
          </div>
        )}
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left toolbar */}
        <div className="w-10 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col items-center py-2 gap-1 shrink-0">
          <ToolButton icon={<CursorIcon />} title="Cursor" active />
          <ToolButton icon={<SelectIcon />} title="Select" />
          <ToolButton icon={<PenIcon />} title="Pen" />
          <div className="h-px w-6 bg-neutral-200 dark:bg-neutral-700 my-1" />
          <ToolButton icon={<MicIcon />} title="Voice input" />
          <ToolButton icon={<ImageIcon />} title="Image" />
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`flex-1 overflow-hidden ${isPanning ? 'cursor-grabbing' : spaceDown ? 'cursor-grab' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="min-w-max min-h-max p-16"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: '0 0',
            }}
          >
            <div className="flex gap-8 items-start">
              {/* Screens */}
              <div className="flex gap-4">
                {project.screens.length > 0 ? (
                  project.screens.map((screen) => (
                    <ScreenCard
                      key={screen.id}
                      screen={screen}
                      width={screenWidth}
                      height={screenHeight}
                      isSelected={selectedScreen === screen.name}
                      deviceType={deviceType}
                      onClick={() => setSelectedScreen(selectedScreen === screen.name ? null : screen.name)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setSelectedScreen(screen.name)
                        setContextMenu({ x: e.clientX, y: e.clientY })
                      }}
                    />
                  ))
                ) : (
                  /* Empty state placeholder */
                  <div className="flex flex-col items-center justify-center" style={{ width: screenWidth * 0.5, height: screenHeight * 0.5 }}>
                    <div className="rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center w-full h-full bg-neutral-100 dark:bg-neutral-800">
                      {isGenerating ? (
                        <div className="flex flex-col items-center gap-3">
                          <LoadingSpinner size="lg" />
                          <span className="text-sm text-neutral-500">Generating your design...</span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">
                          Enter a prompt to generate a screen
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right floating panel */}
        <RightPanel
          designSystem={designSystem}
          screenNames={project.screens.map(s => s.name)}
          selectedScreen={selectedScreen}
          onSelectScreen={(name) => setSelectedScreen(selectedScreen === name ? null : name)}
          onDesignSystemUpdate={(ds) => onProjectUpdate({
            ...project,
            designSystem: ds,
            updatedAt: new Date().toLocaleDateString(),
          })}
        />
      </div>

      {/* Bottom: Prompt Bar + Agent Log */}
      <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <PromptBar
            placeholder={
              selectedScreen
                ? `Describe changes for "${selectedScreen}"...`
                : 'What would you like to change or create?'
            }
            deviceType={deviceType}
            onDeviceTypeChange={setDeviceType}
            onSubmit={handlePromptSubmit}
            selectedScreen={selectedScreen || undefined}
            onRemoveScreen={() => setSelectedScreen(null)}
          />
        </div>

        {/* Agent Log */}
        <AgentLog
          isOpen={agentLogOpen}
          onToggle={() => setAgentLogOpen(!agentLogOpen)}
          entries={logEntries}
        />
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-20 right-14 flex items-center gap-2">
        <button
          onClick={() => setZoom(100)}
          className="px-2 py-1 text-xs font-medium rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm"
        >
          {Math.round(zoom)}%
        </button>
      </div>

      {/* Right-click context menu */}
      {contextMenu && selectedScreen && (
        <ScreenContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleScreenAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* View Code Modal */}
      {showCodeModal && selectedScreenObj && (
        <ViewCodeModal
          screenName={selectedScreenObj.name}
          html={selectedScreenObj.html}
          onClose={() => setShowCodeModal(false)}
          onCopy={() => {
            navigator.clipboard.writeText(selectedScreenObj.html)
            addLog(`Copied code for "${selectedScreenObj.name}"`, 'success')
          }}
        />
      )}
    </div>
  )
}

// Screen card with iframe rendering
function ScreenCard({
  screen, width, height, isSelected, deviceType, onClick, onContextMenu,
}: {
  screen: Screen; width: number; height: number; deviceType: 'app' | 'web' | 'tablet'
  isSelected?: boolean; onClick?: () => void; onContextMenu?: (e: React.MouseEvent) => void
}) {
  const scale = 0.5
  const displayWidth = width * scale
  const displayHeight = height * scale

  return (
    <div data-screen-card className="flex flex-col cursor-pointer" onClick={onClick} onContextMenu={onContextMenu}>
      <div className="flex items-center gap-1 mb-1 text-xs text-neutral-500">
        {deviceType === 'app' ? <PhoneSmallIcon /> : deviceType === 'tablet' ? <TabletSmallIcon /> : <MonitorSmallIcon />}
        <span>{screen.name}</span>
      </div>
      <div
        className={`rounded-xl border-2 overflow-hidden transition-colors ${
          isSelected
            ? 'border-blue-500 shadow-lg shadow-blue-500/20'
            : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-400'
        }`}
        style={{ width: displayWidth, height: displayHeight }}
      >
        <iframe
          srcDoc={screen.html}
          title={screen.name}
          sandbox="allow-scripts"
          className="pointer-events-none"
          style={{
            width: width,
            height: height,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            border: 'none',
          }}
        />
      </div>
      {isSelected && (
        <div className="text-[10px] text-blue-500 mt-1 text-center">{width} x {height}</div>
      )}
    </div>
  )
}

function LoadingSpinner({ size }: { size?: 'lg' }) {
  const s = size === 'lg' ? 'w-6 h-6' : 'w-3.5 h-3.5'
  return (
    <svg className={`${s} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function ViewCodeModal({ screenName, html, onClose, onCopy }: {
  screenName: string; html: string; onClose: () => void; onCopy: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[720px] max-h-[80vh] bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold">{screenName} — Source Code</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600"
            >
              Copy
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <XSmallIcon />
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto p-5 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-mono whitespace-pre-wrap break-all">
          {html}
        </pre>
      </div>
    </div>
  )
}

function XSmallIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
}

// Sub-components
function MenuItem({ icon, label, shortcut, onClick }: { icon: string; label: string; shortcut?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
    >
      <span className="w-5 text-center">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-xs text-neutral-400">{shortcut}</span>}
    </button>
  )
}

function ToolButton({ icon, title, active }: { icon: React.ReactNode; title: string; active?: boolean }) {
  return (
    <button
      title={title}
      className={`p-1.5 rounded-lg ${
        active ? 'bg-neutral-100 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
      }`}
    >
      {icon}
    </button>
  )
}

// Icons
function MenuIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
}
function CursorIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z" /></svg>
}
function SelectIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" /></svg>
}
function PenIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7H12v-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /></svg>
}
function MicIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="1" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v4M8 23h8" /></svg>
}
function ImageIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
}
function StarIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}
function PhoneSmallIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
}
function TabletSmallIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M12 18h.01" /></svg>
}
function MonitorSmallIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
}
