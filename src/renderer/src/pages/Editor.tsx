import { useState, useRef, useCallback } from 'react'
import type { Project } from '../App'
import { PromptBar } from '../components/common/PromptBar'
import { DesignSystemCard } from '../components/design-system/DesignSystemCard'
import { AgentLog } from '../components/editor/AgentLog'
import { ScreenContextToolbar, ScreenContextMenu } from '../components/editor/ScreenContextToolbar'

interface EditorProps {
  project: Project
  onBack: () => void
}

export function Editor({ project, onBack }: EditorProps) {
  const [zoom, setZoom] = useState(100)
  const [isRunning, setIsRunning] = useState(false)
  const [showHamburger, setShowHamburger] = useState(false)
  const [deviceType, setDeviceType] = useState<'app' | 'web'>('app')
  const [agentLogOpen, setAgentLogOpen] = useState(true)
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Canvas pan state
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
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
    setIsRunning(!isRunning)
    if (!isRunning) {
      window.electronAPI?.openLiveWindow()
    } else {
      window.electronAPI?.closeLiveWindow()
    }
  }

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
                <MenuItem icon="📁" label="Open project folder" />
                <MenuItem icon="📝" label="Open in external editor" />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MenuItem icon="🎨" label="Appearance" />
                <MenuItem icon="⚙" label="Settings" />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MenuItem icon="⌘" label="Command menu" shortcut="⌘K" />
              </div>
            )}
          </div>

          <span className="text-sm font-medium">{project.name}</span>
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

          <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Settings">
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Screen context toolbar - shown when a screen is selected */}
        {selectedScreen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1 z-40">
            <ScreenContextToolbar
              screenName={selectedScreen}
              onAction={(action) => console.log('Action:', action, selectedScreen)}
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
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
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
            {/* Design System Card */}
            <div className="flex gap-8 items-start">
              <DesignSystemCard
                name="Kinetic Volt"
                colors={{
                  primary: { base: '#CCFF00', tones: ['#000000','#161e00','#283500','#3c4d00','#506600','#668100','#7c9c00','#93b900','#abd600','#c3f400','#daff6e','#ffffff'] },
                  secondary: { base: '#A2A003', tones: ['#000000','#1d1d00','#333200','#4a4900','#636100','#7d7b00','#979500','#b3b01f','#cfcc3c','#ece856','#faf763','#ffffff'] },
                  tertiary: { base: '#C4AB04', tones: ['#000000','#211b00','#393000','#524600','#6d5e00','#897700','#a69000','#c4ab04','#e1c62e','#ffe24a','#fff1b8','#ffffff'] },
                  neutral: { base: '#121212', tones: ['#000000','#1c1b1b','#313030','#474646','#5f5e5e','#787776','#929090','#adabaa','#c8c6c5','#e5e2e1','#f3f0ef','#ffffff'] },
                }}
                typography={{
                  headline: { family: 'Lexend' },
                  body: { family: 'Inter' },
                  label: { family: 'Inter' },
                }}
              />

              {/* Placeholder screens */}
              <div className="flex gap-4">
                {['Dashboard', 'Workout Plans', 'Progress Charts'].map((name) => (
                  <ScreenPlaceholder
                    key={name}
                    name={name}
                    width={390}
                    height={844}
                    isSelected={selectedScreen === name}
                    onClick={() => setSelectedScreen(selectedScreen === name ? null : name)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setSelectedScreen(name)
                      setContextMenu({ x: e.clientX, y: e.clientY })
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right toolbar */}
        <div className="w-10 bg-white dark:bg-neutral-800 border-l border-neutral-200 dark:border-neutral-700 flex flex-col items-center py-2 gap-1 shrink-0">
          <ToolButton icon={<CursorIcon />} title="Cursor" active />
          <ToolButton icon={<SelectIcon />} title="Select box" />
          <ToolButton icon={<PenIcon />} title="Pen" />
          <div className="h-px w-6 bg-neutral-200 dark:bg-neutral-700 my-1" />
          <ToolButton icon={<MicIcon />} title="Voice" />
          <ToolButton icon={<ImageIcon />} title="Image" />
          <ToolButton icon={<SettingsIcon className="w-4 h-4" />} title="Settings" />
          <ToolButton icon={<StarIcon />} title="Favourites" />
        </div>
      </div>

      {/* Bottom: Prompt Bar + Agent Log */}
      <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <PromptBar
            placeholder="What would you like to change or create?"
            deviceType={deviceType}
            onDeviceTypeChange={setDeviceType}
            onSubmit={() => {}}
          />
        </div>

        {/* Agent Log */}
        <AgentLog isOpen={agentLogOpen} onToggle={() => setAgentLogOpen(!agentLogOpen)} />
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
          onAction={(action) => console.log('Context action:', action, selectedScreen)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
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

function ScreenPlaceholder({
  name, width, height, isSelected, onClick, onContextMenu,
}: {
  name: string; width: number; height: number
  isSelected?: boolean; onClick?: () => void; onContextMenu?: (e: React.MouseEvent) => void
}) {
  return (
    <div className="flex flex-col cursor-pointer" onClick={onClick} onContextMenu={onContextMenu}>
      <div className="flex items-center gap-1 mb-1 text-xs text-neutral-500">
        <PhoneSmallIcon />
        <span>{name}</span>
      </div>
      <div
        className={`rounded-xl border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 hover:border-neutral-400'
        }`}
        style={{ width: width * 0.5, height: height * 0.5 }}
      >
        <span className="text-sm text-neutral-400">
          {width} x {height}
        </span>
      </div>
      {isSelected && (
        <div className="text-[10px] text-blue-500 mt-1 text-center">{width} x {height}</div>
      )}
    </div>
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
