import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../../lib/i18n'

interface ScreenContextToolbarProps {
  screenName: string
  onAction: (action: string) => void
}

export function ScreenContextToolbar({ screenName, onAction }: ScreenContextToolbarProps) {
  const { t } = useI18n()
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
        label={t('toolbar.generate')}
        icon={<SparkleIcon />}
        isOpen={openMenu === 'generate'}
        onClick={() => toggleMenu('generate')}
        items={[
          { label: t('toolbar.variations'), shortcut: '⇧V', action: 'variations' },
          { label: t('toolbar.regenerate'), shortcut: '⇧R', action: 'regenerate' },
          { label: t('toolbar.desktopWebVersion'), action: 'desktop-web' },
          { label: t('toolbar.predictiveHeatmap'), action: 'heatmap' },
          { label: t('toolbar.regenerateHeatmap'), action: 'heatmap-regenerate' },
        ]}
        onAction={(action) => { onAction(action); setOpenMenu(null) }}
      />
      <DropdownButton
        label={t('toolbar.modify')}
        icon={<PenIcon />}
        isOpen={openMenu === 'modify'}
        onClick={() => toggleMenu('modify')}
        items={[
          { label: t('toolbar.edit'), shortcut: 'E', action: 'edit' },
          { label: t('toolbar.annotate'), action: 'annotate' },
          { label: t('toolbar.designSystem'), action: 'design-system' },
        ]}
        onAction={(action) => { onAction(action); setOpenMenu(null) }}
      />
      <DropdownButton
        label={t('toolbar.run')}
        icon={<PlayIcon />}
        isOpen={openMenu === 'run'}
        onClick={() => toggleMenu('run')}
        items={[
          { label: t('toolbar.runInPopup'), action: 'run-popup' },
          { label: t('toolbar.openInBrowser'), action: 'open-browser' },
          { separator: true },
          { label: t('toolbar.mobile'), info: '390×884', action: 'device-mobile' },
          { label: t('toolbar.tablet'), info: '768×1024', action: 'device-tablet' },
          { label: t('toolbar.desktop'), info: '1280×1024', action: 'device-desktop' },
          { separator: true },
          { label: t('toolbar.alwaysOnTop'), action: 'always-on-top' },
          { label: t('toolbar.openDevTools'), action: 'devtools' },
        ]}
        onAction={(action) => { onAction(action); setOpenMenu(null) }}
      />
      <DropdownButton
        label={t('toolbar.more')}
        icon={<MoreIcon />}
        isOpen={openMenu === 'more'}
        onClick={() => toggleMenu('more')}
        badge
        items={[
          { label: t('toolbar.viewCode'), shortcut: '⇧C', action: 'view-code' },
          { label: t('toolbar.openInEditor'), shortcut: '⌘E', action: 'open-editor' },
          { separator: true },
          { label: t('toolbar.copyAsCode'), action: 'copy-code' },
          { label: t('toolbar.copyAsPng'), shortcut: '⌘⇧C', action: 'copy-png' },
          { separator: true },
          { label: t('toolbar.download'), shortcut: '⇧D', action: 'download' },
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
  const { t } = useI18n()
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
        { label: t('common.copy'), shortcut: '⌘C', action: 'copy' },
        { label: t('toolbar.copyAs'), shortcut: '▶', action: 'copy-as' },
        { label: t('toolbar.cut'), shortcut: '⌘X', action: 'cut' },
        { label: t('toolbar.duplicate'), shortcut: '⌘D', action: 'duplicate' },
        { label: t('toolbar.focus'), shortcut: 'F', action: 'focus' },
        { label: t('toolbar.favourite'), shortcut: '⇧F', action: 'favourite' },
      ],
    },
    {
      items: [
        { label: t('common.delete'), shortcut: '⌫', action: 'delete' },
      ],
    },
    {
      header: t('toolbar.sectionGenerate'),
      items: [
        { label: t('toolbar.variations'), shortcut: '⇧V', action: 'variations' },
        { label: t('toolbar.regenerate'), shortcut: '⇧R', action: 'regenerate' },
        { label: t('toolbar.desktopWebVersion'), action: 'desktop-web' },
        { label: t('toolbar.predictiveHeatmap'), action: 'heatmap' },
      ],
    },
    {
      header: t('toolbar.sectionEdit'),
      items: [
        { label: t('toolbar.edit'), shortcut: 'E', action: 'edit' },
        { label: t('toolbar.annotate'), action: 'annotate' },
        { label: t('toolbar.designSystem'), action: 'design-system' },
      ],
    },
    {
      header: t('toolbar.sectionRun'),
      items: [
        { label: t('toolbar.runInPopup'), shortcut: '⇧P', action: 'run-popup' },
        { label: t('toolbar.openInBrowser'), action: 'open-browser' },
        { label: t('toolbar.mobile'), info: '390×884', action: 'device-mobile' },
        { label: t('toolbar.tablet'), info: '768×1024', action: 'device-tablet' },
        { label: t('toolbar.desktop'), info: '1280×1024', action: 'device-desktop' },
      ],
    },
    {
      items: [
        { label: t('toolbar.viewCode'), shortcut: '⇧C', action: 'view-code' },
        { label: t('toolbar.openInEditor'), shortcut: '⌘E', action: 'open-editor' },
        { label: t('toolbar.download'), shortcut: '⇧D', action: 'download' },
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
