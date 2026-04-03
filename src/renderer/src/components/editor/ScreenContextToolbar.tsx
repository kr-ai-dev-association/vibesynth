import { useState, useRef, useEffect } from 'react'

interface ScreenContextToolbarProps {
  screenName: string
  onAction: (action: string) => void
}

export function ScreenContextToolbar({ screenName, onAction }: ScreenContextToolbarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  return (
    <div ref={toolbarRef} className="flex items-center gap-0.5 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 px-1 py-0.5">
      <DropdownButton
        label="Generate"
        icon={<SparkleIcon />}
        isOpen={openMenu === 'generate'}
        onClick={() => toggleMenu('generate')}
        items={[
          { label: 'Variations', shortcut: '⇧V', action: 'variations' },
          { label: 'Regenerate', shortcut: '⇧R', action: 'regenerate' },
          { label: 'Desktop web version', action: 'desktop-web' },
          { label: 'Predictive heat map', action: 'heatmap' },
        ]}
        onAction={(action) => { onAction(action); setOpenMenu(null) }}
      />
      <DropdownButton
        label="Modify"
        icon={<PenIcon />}
        isOpen={openMenu === 'modify'}
        onClick={() => toggleMenu('modify')}
        items={[
          { label: 'Edit', shortcut: 'E', action: 'edit' },
          { label: 'Annotate', action: 'annotate' },
          { label: 'Design system', action: 'design-system' },
        ]}
        onAction={(action) => { onAction(action); setOpenMenu(null) }}
      />
      <DropdownButton
        label="Run"
        icon={<PlayIcon />}
        isOpen={openMenu === 'run'}
        onClick={() => toggleMenu('run')}
        items={[
          { label: 'Run in Popup', action: 'run-popup' },
          { label: 'Open in Browser', action: 'open-browser' },
          { separator: true },
          { label: 'Mobile', info: '390×884', action: 'device-mobile' },
          { label: 'Tablet', info: '768×1024', action: 'device-tablet' },
          { label: 'Desktop', info: '1280×1024', action: 'device-desktop' },
          { separator: true },
          { label: 'Always on Top', action: 'always-on-top' },
          { label: 'Open DevTools', action: 'devtools' },
        ]}
        onAction={(action) => { onAction(action); setOpenMenu(null) }}
      />
      <DropdownButton
        label="More"
        icon={<MoreIcon />}
        isOpen={openMenu === 'more'}
        onClick={() => toggleMenu('more')}
        badge
        items={[
          { label: 'View code', shortcut: '⇧C', action: 'view-code' },
          { label: 'Open in Editor', shortcut: '⌘E', action: 'open-editor' },
          { separator: true },
          { label: 'Copy as Code', action: 'copy-code' },
          { label: 'Copy as PNG', shortcut: '⌘⇧C', action: 'copy-png' },
          { separator: true },
          { label: 'Download', shortcut: '⇧D', action: 'download' },
        ]}
        onAction={(action) => { onAction(action); setOpenMenu(null) }}
      />
    </div>
  )
}

interface MenuItem {
  label?: string
  shortcut?: string
  info?: string
  action?: string
  separator?: boolean
}

function DropdownButton({
  label,
  icon,
  isOpen,
  onClick,
  items,
  onAction,
  badge,
}: {
  label: string
  icon: React.ReactNode
  isOpen: boolean
  onClick: () => void
  items: MenuItem[]
  onAction: (action: string) => void
  badge?: boolean
}) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          isOpen ? 'bg-neutral-100 dark:bg-neutral-700' : ''
        }`}
      >
        <span className="w-4 h-4">{icon}</span>
        <span>{label}</span>
        {badge && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />}
        <ChevronDownIcon className="w-3 h-3 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
            ) : (
              <button
                key={i}
                onClick={() => item.action && onAction(item.action)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                <span>{item.label}</span>
                <span className="text-xs text-neutral-400">{item.shortcut || item.info || ''}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// --- Context Menu (right-click) ---

interface ContextMenuProps {
  x: number
  y: number
  onAction: (action: string) => void
  onClose: () => void
}

export function ScreenContextMenu({ x, y, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleAction = (action: string) => {
    onAction(action)
    onClose()
  }

  const sections: { header?: string; items: MenuItem[] }[] = [
    {
      items: [
        { label: 'Copy', shortcut: '⌘C', action: 'copy' },
        { label: 'Copy as...', shortcut: '▶', action: 'copy-as' },
        { label: 'Cut', shortcut: '⌘X', action: 'cut' },
        { label: 'Duplicate', shortcut: '⌘D', action: 'duplicate' },
        { label: 'Focus', shortcut: 'F', action: 'focus' },
        { label: 'Favourite', shortcut: '⇧F', action: 'favourite' },
      ],
    },
    {
      items: [
        { label: 'Delete', shortcut: '⌫', action: 'delete' },
      ],
    },
    {
      header: 'GENERATE',
      items: [
        { label: 'Variations', shortcut: '⇧V', action: 'variations' },
        { label: 'Regenerate', shortcut: '⇧R', action: 'regenerate' },
        { label: 'Desktop web version', action: 'desktop-web' },
        { label: 'Predictive heat map', action: 'heatmap' },
      ],
    },
    {
      header: 'EDIT',
      items: [
        { label: 'Edit', shortcut: 'E', action: 'edit' },
        { label: 'Annotate', action: 'annotate' },
        { label: 'Design system', action: 'design-system' },
      ],
    },
    {
      header: 'RUN',
      items: [
        { label: 'Run in Popup', shortcut: '⇧P', action: 'run-popup' },
        { label: 'Open in Browser', action: 'open-browser' },
        { label: 'Mobile', info: '390×884', action: 'device-mobile' },
        { label: 'Tablet', info: '768×1024', action: 'device-tablet' },
        { label: 'Desktop', info: '1280×1024', action: 'device-desktop' },
      ],
    },
    {
      items: [
        { label: 'View code', shortcut: '⇧C', action: 'view-code' },
        { label: 'Open in Editor', shortcut: '⌘E', action: 'open-editor' },
        { label: 'Download', shortcut: '⇧D', action: 'download' },
      ],
    },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-60 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 text-sm"
      style={{ left: x, top: y }}
    >
      {sections.map((section, si) => (
        <div key={si}>
          {si > 0 && <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />}
          {section.header && (
            <div className="px-3 pt-1.5 pb-0.5 text-[10px] font-semibold text-neutral-400 tracking-wider">
              {section.header}
            </div>
          )}
          {section.items.map((item, ii) => (
            <button
              key={ii}
              onClick={() => item.action && handleAction(item.action)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              <span>{item.label}</span>
              <span className="text-xs text-neutral-400">{item.shortcut || item.info || ''}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// Icons
function SparkleIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" /></svg>
}
function PenIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function PlayIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" /></svg>
}
function MoreIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
}
function ChevronDownIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
}
