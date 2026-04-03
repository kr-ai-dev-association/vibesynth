import { useState } from 'react'
import type { DesignSystem, DesignGuide } from '../../App'

type PanelTab = 'design' | 'components' | 'layers'

const TONE_LABELS = ['T0','T10','T20','T30','T40','T50','T60','T70','T80','T90','T95','T100']

interface RightPanelProps {
  designSystem: DesignSystem
  screenNames: string[]
  selectedScreen: string | null
  onSelectScreen: (name: string) => void
  onDesignSystemUpdate?: (ds: DesignSystem) => void
}

export function RightPanel({ designSystem, screenNames, selectedScreen, onSelectScreen, onDesignSystemUpdate }: RightPanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [tab, setTab] = useState<PanelTab>('design')
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedValue(value)
    setTimeout(() => setCopiedValue(null), 1200)
  }

  if (!isOpen) {
    return (
      <div className="absolute right-3 top-3 z-30 flex flex-col gap-1.5">
        <button
          onClick={() => setIsOpen(true)}
          className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700"
          title="Open panel"
        >
          <PanelIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="absolute right-3 top-3 bottom-20 z-30 w-72 flex flex-col bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700 shrink-0">
        <div className="flex flex-1">
          <TabButton active={tab === 'design'} onClick={() => setTab('design')}>
            <PaletteIcon className="w-3.5 h-3.5" /> Design
          </TabButton>
          <TabButton active={tab === 'components'} onClick={() => setTab('components')}>
            <ComponentIcon className="w-3.5 h-3.5" /> Components
          </TabButton>
          <TabButton active={tab === 'layers'} onClick={() => setTab('layers')}>
            <LayersIcon className="w-3.5 h-3.5" /> Layers
          </TabButton>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400"
          title="Close panel"
        >
          <XIcon />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'design' && (
          <DesignTab designSystem={designSystem} onCopy={handleCopy} copiedValue={copiedValue} onDesignSystemUpdate={onDesignSystemUpdate} />
        )}
        {tab === 'components' && (
          <ComponentsTab designSystem={designSystem} />
        )}
        {tab === 'layers' && (
          <LayersTab screenNames={screenNames} selectedScreen={selectedScreen} onSelectScreen={onSelectScreen} />
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors ${
        active
          ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
      }`}
    >
      {children}
    </button>
  )
}

const GUIDE_SECTIONS: { key: keyof DesignGuide; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '💡' },
  { key: 'colorRules', label: 'Color Rules', icon: '🎨' },
  { key: 'typographyRules', label: 'Typography', icon: '🔤' },
  { key: 'elevationRules', label: 'Elevation', icon: '📐' },
  { key: 'componentRules', label: 'Components', icon: '🧩' },
  { key: 'dosAndDonts', label: "Do's & Don'ts", icon: '✅' },
]

// === Design Tab ===
function DesignTab({ designSystem, onCopy, copiedValue, onDesignSystemUpdate }: {
  designSystem: DesignSystem; onCopy: (v: string) => void; copiedValue: string | null; onDesignSystemUpdate?: (ds: DesignSystem) => void
}) {
  const [editingGuideKey, setEditingGuideKey] = useState<keyof DesignGuide | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const isPlaceholder = designSystem.name === 'Generating...'

  const startEdit = (key: keyof DesignGuide) => {
    setEditingGuideKey(key)
    setEditValue(designSystem.guide?.[key] || '')
  }

  const saveEdit = () => {
    if (!editingGuideKey || !onDesignSystemUpdate) return
    const updatedGuide: DesignGuide = {
      overview: designSystem.guide?.overview || '',
      colorRules: designSystem.guide?.colorRules || '',
      typographyRules: designSystem.guide?.typographyRules || '',
      elevationRules: designSystem.guide?.elevationRules || '',
      componentRules: designSystem.guide?.componentRules || '',
      dosAndDonts: designSystem.guide?.dosAndDonts || '',
      [editingGuideKey]: editValue,
    }
    onDesignSystemUpdate({ ...designSystem, guide: updatedGuide })
    setEditingGuideKey(null)
  }

  if (isPlaceholder) {
    return (
      <div className="p-3 space-y-4">
        <div className="flex items-center gap-2">
          <PaletteIcon className="w-4 h-4 text-neutral-400 animate-pulse" />
          <span className="text-sm font-semibold text-neutral-400 animate-pulse">Generating design system...</span>
        </div>
        <div className="space-y-3">
          {['Primary', 'Secondary', 'Tertiary', 'Neutral'].map((label) => (
            <div key={label}>
              <span className="text-[11px] font-medium text-neutral-400">{label}</span>
              <div className="flex gap-px rounded-lg overflow-hidden mt-1">
                {Array(12).fill(null).map((_, i) => (
                  <div key={i} className="flex-1 h-6 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-neutral-400 text-center py-2">
          AI is analyzing the design to extract colors, typography, and theme...
        </p>
      </div>
    )
  }

  const colorRoles = [
    { label: 'Primary', ...designSystem.colors.primary },
    { label: 'Secondary', ...designSystem.colors.secondary },
    { label: 'Tertiary', ...designSystem.colors.tertiary },
    { label: 'Neutral', ...designSystem.colors.neutral },
  ]

  return (
    <div className="p-3 space-y-4">
      {/* Theme name */}
      <div className="flex items-center gap-2">
        <PaletteIcon className="w-4 h-4 text-neutral-500" />
        <span className="text-sm font-semibold">{designSystem.name}</span>
      </div>

      {/* Colors */}
      <div>
        <SectionLabel>Color Palette</SectionLabel>
        <div className="space-y-3 mt-2">
          {colorRoles.map((role) => (
            <div key={role.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-neutral-500">{role.label}</span>
                <button
                  onClick={() => onCopy(role.base)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-600 font-mono"
                >
                  {copiedValue === role.base ? '✓ Copied' : role.base}
                </button>
              </div>
              <div className="flex gap-px rounded-lg overflow-hidden">
                {role.tones.map((tone, i) => (
                  <button
                    key={i}
                    onClick={() => onCopy(tone)}
                    className="flex-1 h-6 hover:ring-2 hover:ring-blue-400 hover:z-10 relative group transition-all"
                    style={{ backgroundColor: tone }}
                    title={`${TONE_LABELS[i]}: ${tone}`}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[9px] bg-neutral-900 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-30 shadow-lg">
                      {TONE_LABELS[i]} {tone}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <SectionLabel>Typography</SectionLabel>
        <div className="mt-2 space-y-2">
          {Object.entries(designSystem.typography).map(([level, { family }]) => (
            <div key={level} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700/50 rounded-lg px-3 py-2">
              <div>
                <span className="text-[11px] font-medium text-neutral-500 capitalize">{level}</span>
                <span className="text-[11px] text-neutral-400 ml-1.5">{family}</span>
              </div>
              <span className="text-lg font-semibold" style={{ fontFamily: family }}>Aa</span>
            </div>
          ))}
        </div>
      </div>

      {/* Design Guide */}
      <div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full group"
        >
          <SectionLabel>Design Guide</SectionLabel>
          <ChevronIcon className={`w-3 h-3 text-neutral-400 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>

        {showGuide && (
          <div className="mt-2 space-y-2">
            {designSystem.guide ? (
              GUIDE_SECTIONS.map(({ key, label, icon }) => (
                <div key={key} className="rounded-lg bg-neutral-50 dark:bg-neutral-700/50 overflow-hidden">
                  {editingGuideKey === key ? (
                    <div className="p-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px]">{icon}</span>
                        <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
                      </div>
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={5}
                        className="w-full text-[11px] leading-relaxed bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md p-2 resize-y outline-none focus:border-blue-400"
                      />
                      <div className="flex justify-end gap-1.5 mt-1.5">
                        <button
                          onClick={() => setEditingGuideKey(null)}
                          className="px-2.5 py-1 text-[10px] font-medium rounded-md border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(key)}
                      className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-600/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">{icon}</span>
                          <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
                        </div>
                        <EditSmallIcon className="w-3 h-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-3">
                        {designSystem.guide?.[key] || 'Click to add...'}
                      </p>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[11px] text-neutral-400 text-center py-3">
                Design guide will be generated with your first screen.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// === Components Tab ===
function ComponentsTab({ designSystem }: { designSystem: DesignSystem }) {
  const { colors } = designSystem

  return (
    <div className="p-3 space-y-4">
      <div>
        <SectionLabel>Buttons</SectionLabel>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-1.5 text-xs font-medium rounded-full text-white" style={{ backgroundColor: colors.primary.base }}>Primary</button>
            <button className="px-4 py-1.5 text-xs font-medium rounded-full text-white" style={{ backgroundColor: colors.secondary.base }}>Secondary</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-1.5 text-xs font-medium rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900">Inverted</button>
            <button className="px-4 py-1.5 text-xs font-medium rounded-full border border-neutral-400 text-neutral-700 dark:text-neutral-300">Outlined</button>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Search Bar</SectionLabel>
        <div className="mt-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-400 text-xs">
            <SearchSmallIcon />
            <span>Search</span>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Bottom Navigation</SectionLabel>
        <div className="mt-2 flex justify-around bg-neutral-100 dark:bg-neutral-700 rounded-xl py-2.5 px-4">
          <NavItem icon="home" label="Home" active color={colors.primary.base} />
          <NavItem icon="search" label="Search" />
          <NavItem icon="person" label="Profile" />
        </div>
      </div>

      <div>
        <SectionLabel>FAB</SectionLabel>
        <div className="mt-2 flex items-center gap-3">
          <button
            className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"
            style={{ backgroundColor: colors.primary.base }}
          >
            <EditIcon />
          </button>
          <span className="text-[11px] text-neutral-400">Floating Action Button</span>
        </div>
      </div>

      <div>
        <SectionLabel>Chips</SectionLabel>
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-700">
            <span className="text-[10px]">✨</span> auto_fix
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-700">
            <span className="text-[10px]">📦</span> category
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-700">
            <span className="text-[10px]">🏷</span> sell
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-700">
            <span className="text-[10px]">🗑</span> delete
          </span>
        </div>
      </div>

      <div>
        <SectionLabel>Icon Set</SectionLabel>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {['✨','📦','🏷','🗑','✏️','🔍','🏠','👤','⭐','💬','📎','⚙️'].map((icon, i) => (
            <div key={i} className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-700 text-sm">
              {icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// === Layers Tab ===
function LayersTab({ screenNames, selectedScreen, onSelectScreen }: {
  screenNames: string[]; selectedScreen: string | null; onSelectScreen: (name: string) => void
}) {
  return (
    <div className="p-3 space-y-1">
      <SectionLabel>Screens ({screenNames.length})</SectionLabel>
      {screenNames.length === 0 ? (
        <p className="text-xs text-neutral-400 mt-2">No screens yet. Generate one using the prompt bar.</p>
      ) : (
        <div className="mt-2 space-y-0.5">
          {screenNames.map((name, i) => (
            <button
              key={name}
              onClick={() => onSelectScreen(name)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
                selectedScreen === name
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              <span className="w-5 h-5 rounded bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center text-[10px] font-medium text-neutral-500">
                {i + 1}
              </span>
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// === Shared ===
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{children}</p>
}

function NavItem({ icon, label, active, color }: { icon: string; label: string; active?: boolean; color?: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    home: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>,
    search: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    person: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  }
  return (
    <div className="flex flex-col items-center gap-0.5" style={active ? { color } : undefined}>
      <span className={active ? '' : 'text-neutral-400'}>{iconMap[icon]}</span>
      <span className={`text-[9px] ${active ? 'font-medium' : 'text-neutral-400'}`}>{label}</span>
    </div>
  )
}

// Icons
function PanelIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /></svg>
}
function PaletteIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="8" r="1.5" fill="currentColor" /><circle cx="8" cy="12" r="1.5" fill="currentColor" /><circle cx="16" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="16" r="1.5" fill="currentColor" /></svg>
}
function ComponentIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
}
function LayersIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
}
function XIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
}
function SearchSmallIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
}
function EditIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function EditSmallIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
}
