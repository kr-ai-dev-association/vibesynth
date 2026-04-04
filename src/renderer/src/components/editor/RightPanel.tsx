import { useState, useEffect, useMemo } from 'react'
import type { DesignSystem, DesignGuide } from '../../App'
import { PINTEREST_DESIGNS } from '../../lib/pinterest-designs'
import { useI18n } from '../../lib/i18n'
import { GOOGLE_FONTS as GOOGLE_FONTS_LIST } from '../../lib/google-fonts'

type PanelTab = 'design' | 'components' | 'layers'

const TONE_LABELS = ['T0','T10','T20','T30','T40','T50','T60','T70','T80','T90','T95','T100']

interface SavedEntry { id: string; name: string; savedAt: string }

interface RightPanelProps {
  designSystem: DesignSystem
  screenNames: string[]
  selectedScreen: string | null
  onSelectScreen: (name: string) => void
  onDesignSystemUpdate?: (ds: DesignSystem) => void
  onSaveDesignSystem?: () => void
  onLoadDesignSystem?: (id: string) => void
  onDeleteDesignSystem?: (id: string) => void
  savedDesignSystems?: SavedEntry[]
  onStealDesign?: (query: string) => void
  onStealUrl?: (url: string) => void
  onConnectPinterest?: () => void
}

export function RightPanel({ designSystem, screenNames, selectedScreen, onSelectScreen, onDesignSystemUpdate, onSaveDesignSystem, onLoadDesignSystem, onDeleteDesignSystem, savedDesignSystems, onStealDesign, onStealUrl, onConnectPinterest }: RightPanelProps) {
  const { t } = useI18n()
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
          title={t('panel.open')}
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
            <PaletteIcon className="w-3.5 h-3.5" /> {t('panel.design')}
          </TabButton>
          <TabButton active={tab === 'components'} onClick={() => setTab('components')}>
            <ComponentIcon className="w-3.5 h-3.5" /> {t('panel.components')}
          </TabButton>
          <TabButton active={tab === 'layers'} onClick={() => setTab('layers')}>
            <LayersIcon className="w-3.5 h-3.5" /> {t('panel.layers')}
          </TabButton>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400"
          title={t('panel.close')}
        >
          <XIcon />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'design' && (
          <DesignTab designSystem={designSystem} onCopy={handleCopy} copiedValue={copiedValue} onDesignSystemUpdate={onDesignSystemUpdate} onSave={onSaveDesignSystem} onLoad={onLoadDesignSystem} onDelete={onDeleteDesignSystem} savedSystems={savedDesignSystems} onSteal={onStealDesign} onStealUrl={onStealUrl} onConnect={onConnectPinterest} />
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

const GUIDE_SECTIONS: { key: keyof DesignGuide; labelKey: 'panel.guideOverview' | 'panel.guideColorRules' | 'panel.guideTypography' | 'panel.guideElevation' | 'panel.guideComponents' | 'panel.guideDosAndDonts'; icon: string }[] = [
  { key: 'overview', labelKey: 'panel.guideOverview', icon: '💡' },
  { key: 'colorRules', labelKey: 'panel.guideColorRules', icon: '🎨' },
  { key: 'typographyRules', labelKey: 'panel.guideTypography', icon: '🔤' },
  { key: 'elevationRules', labelKey: 'panel.guideElevation', icon: '📐' },
  { key: 'componentRules', labelKey: 'panel.guideComponents', icon: '🧩' },
  { key: 'dosAndDonts', labelKey: 'panel.guideDosAndDonts', icon: '✅' },
]

// === Recommended Designs ===
function RecommendedDesigns({ onLoad }: { onLoad: (id: string) => void }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const designs = useMemo(() => PINTEREST_DESIGNS, [])

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 w-full"
      >
        <SectionLabel>{t('panel.recommendedDesigns')}</SectionLabel>
        <span className="text-[9px] text-neutral-400 ml-auto">{expanded ? '▲' : '▼'} {designs.length}</span>
      </button>
      {expanded && (
        <div className="mt-1.5 grid grid-cols-2 gap-1.5" data-testid="recommended-designs">
          {designs.map((d) => (
            <button
              key={d.id}
              data-testid={`recommended-${d.id}`}
              onClick={() => onLoad(d.id)}
              className="text-left rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all overflow-hidden group"
            >
              <div className="flex h-4">
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.primary.base }} />
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.secondary.base }} />
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.tertiary.base }} />
                <div className="flex-1" style={{ backgroundColor: d.designSystem.colors.neutral.base }} />
              </div>
              <div className="px-1.5 py-1">
                <div className="text-[9px] font-medium truncate group-hover:text-blue-500 transition-colors">{d.name}</div>
                <div className="text-[8px] text-neutral-400 truncate">{d.designSystem.typography.headline.family}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// === Design Tab ===
function DesignTab({ designSystem, onCopy, copiedValue, onDesignSystemUpdate, onSave, onLoad, onDelete, savedSystems, onSteal, onStealUrl, onConnect }: {
  designSystem: DesignSystem; onCopy: (v: string) => void; copiedValue: string | null; onDesignSystemUpdate?: (ds: DesignSystem) => void
  onSave?: () => void; onLoad?: (id: string) => void; onDelete?: (id: string) => void; savedSystems?: SavedEntry[]; onSteal?: (query: string) => void; onStealUrl?: (url: string) => void; onConnect?: () => void
}) {
  const { t } = useI18n()
  const [editingGuideKey, setEditingGuideKey] = useState<keyof DesignGuide | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showGuide, setShowGuide] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(designSystem.name)
  const [editingColor, setEditingColor] = useState<{ role: string; index: number } | null>(null)
  const [colorValue, setColorValue] = useState('')
  const [editingFont, setEditingFont] = useState<string | null>(null)
  const [fontValue, setFontValue] = useState('')
  const [showStealMenu, setShowStealMenu] = useState(false)
  const [stealUrlValue, setStealUrlValue] = useState('')
  const [stealUrlLoading, setStealUrlLoading] = useState(false)

  // Pending changes — accumulated until "Apply" button is clicked
  const [pendingDS, setPendingDS] = useState<DesignSystem>(designSystem)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync pendingDS when external designSystem fundamentally changes
  // (e.g., loaded from DB, steal result, NOT from our own pending updates)
  const dsFingerprint = `${designSystem.name}|${designSystem.colors.primary.base}|${designSystem.typography.headline.family}`
  useEffect(() => {
    setPendingDS(designSystem)
    setHasChanges(false)
    setNameValue(designSystem.name)
    setStealUrlLoading(false)
  }, [dsFingerprint]) // eslint-disable-line react-hooks/exhaustive-deps

  const updatePending = (ds: DesignSystem) => {
    setPendingDS(ds)
    setHasChanges(true)
  }

  const applyChanges = () => {
    if (onDesignSystemUpdate && hasChanges) {
      onDesignSystemUpdate(pendingDS)
      setHasChanges(false)
    }
  }

  const isPlaceholder = pendingDS.name === 'Generating...'

  const saveNameEdit = () => {
    if (nameValue.trim()) {
      updatePending({ ...pendingDS, name: nameValue.trim() })
    }
    setEditingName(false)
  }

  const saveColorEdit = () => {
    if (!editingColor || !/^#[0-9a-fA-F]{3,8}$/.test(colorValue)) {
      setEditingColor(null)
      return
    }
    const roleKey = editingColor.role.toLowerCase() as keyof typeof pendingDS.colors
    const role = pendingDS.colors[roleKey]
    if (!role) { setEditingColor(null); return }
    const newTones = [...role.tones]
    newTones[editingColor.index] = colorValue
    const newBase = editingColor.index === 6 ? colorValue : role.base
    updatePending({
      ...designSystem,
      colors: { ...designSystem.colors, [roleKey]: { base: newBase, tones: newTones } },
    })
    setEditingColor(null)
  }

  const saveFontEdit = () => {
    if (!editingFont || !fontValue.trim()) { setEditingFont(null); return }
    const level = editingFont as keyof typeof pendingDS.typography
    if (pendingDS.typography[level]?.family === fontValue.trim()) { setEditingFont(null); return }
    updatePending({
      ...pendingDS,
      typography: { ...pendingDS.typography, [level]: { ...pendingDS.typography[level], family: fontValue.trim() } },
    })
    setEditingFont(null)
  }

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
    updatePending({ ...pendingDS, guide: updatedGuide })
    setEditingGuideKey(null)
  }

  if (isPlaceholder) {
    return (
      <div className="p-3 space-y-4">
        <div className="flex items-center gap-2">
          <PaletteIcon className="w-4 h-4 text-neutral-400 animate-pulse" />
          <span className="text-sm font-semibold text-neutral-400 animate-pulse">{t('panel.generatingDS')}</span>
        </div>
        <div className="space-y-3">
          {[t('panel.primary'), t('panel.secondary'), t('panel.tertiary'), t('panel.neutral')].map((label) => (
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
          {t('panel.dsAnalyzing')}
        </p>
      </div>
    )
  }

  const colorRoles = [
    { label: t('panel.primary'), roleKey: 'Primary', ...pendingDS.colors.primary },
    { label: t('panel.secondary'), roleKey: 'Secondary', ...pendingDS.colors.secondary },
    { label: t('panel.tertiary'), roleKey: 'Tertiary', ...pendingDS.colors.tertiary },
    { label: t('panel.neutral'), roleKey: 'Neutral', ...pendingDS.colors.neutral },
  ]

  return (
    <div className="p-3 space-y-4">
      {/* Theme name — click to edit */}
      <div className="flex items-center gap-2">
        <PaletteIcon className="w-4 h-4 text-neutral-500" />
        {editingName ? (
          <input
            data-testid="theme-name-input"
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveNameEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); if (e.key === 'Escape') setEditingName(false); }}
            className="text-sm font-semibold bg-transparent border-b border-blue-400 outline-none w-full"
          />
        ) : (
          <button
            data-testid="theme-name"
            onClick={() => { setEditingName(true); setNameValue(designSystem.name); }}
            className="text-sm font-semibold hover:text-blue-500 transition-colors text-left"
            title={t('panel.editThemeName')}
          >
            {designSystem.name}
          </button>
        )}
      </div>

      {/* Dark / Light mode switch */}
      {onDesignSystemUpdate && (
        <div className="flex items-center gap-1" data-testid="color-scheme-switch">
          <span className="text-[10px] text-neutral-400 mr-1">Mode:</span>
          {(['light', 'auto', 'dark'] as const).map((mode) => (
            <button
              key={mode}
              data-testid={`scheme-${mode}`}
              onClick={() => {
                // colorScheme 변경은 즉시 적용 (다음 생성에 영향)
                updatePending({ ...pendingDS, colorScheme: mode })
                onDesignSystemUpdate?.({ ...designSystem, colorScheme: mode })
              }}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                (designSystem.colorScheme || 'auto') === mode
                  ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              {mode === 'light' ? '☀️ Light' : mode === 'dark' ? '🌙 Dark' : '🔄 Auto'}
            </button>
          ))}
        </div>
      )}

      {/* Apply Changes button — visible when there are pending changes */}
      {hasChanges && (
        <button
          data-testid="apply-ds-changes"
          onClick={applyChanges}
          className="w-full py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          ✓ Apply Changes to Screens
        </button>
      )}

      {/* Save / Load buttons */}
      {(onSave || (savedSystems && savedSystems.length > 0)) && (
        <div className="flex items-center gap-1.5">
          {onSave && (
            <button
              data-testid="save-design-system"
              onClick={onSave}
              className="flex-1 text-[10px] font-medium px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              {t('panel.saveDS')}
            </button>
          )}
          {onLoad && savedSystems && savedSystems.filter(s => !s.id.startsWith('pin-')).length > 0 && (
            <div className="flex-1 relative group">
              <select
                data-testid="load-design-system"
                onChange={(e) => { if (e.target.value) onLoad(e.target.value); e.target.value = '' }}
                className="w-full text-[10px] font-medium px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                defaultValue=""
              >
                <option value="" disabled>{t('panel.loadSaved')}</option>
                {savedSystems.filter(s => !s.id.startsWith('pin-')).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Saved design systems with delete */}
      {onDelete && savedSystems && savedSystems.filter(s => !s.id.startsWith('pin-')).length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-neutral-400">{t('panel.savedSystems')}</span>
          {savedSystems.filter(s => !s.id.startsWith('pin-')).map(s => (
            <div key={s.id} className="flex items-center gap-1 group">
              <button
                onClick={() => onLoad?.(s.id)}
                className="flex-1 text-left text-[10px] px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 truncate"
              >
                {s.name}
              </button>
              <button
                data-testid={`delete-ds-${s.id}`}
                onClick={() => onDelete(s.id)}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-all"
                title="Delete"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Design Systems */}
      {onLoad && (
        <RecommendedDesigns onLoad={onLoad} />
      )}

      {/* Pinterest Design Steal */}
      {(onSteal || onConnect || onStealUrl) && (
        <div className="relative space-y-1.5">
          <SectionLabel>{t('panel.stealDesign')}</SectionLabel>

          {/* Step 1: Browse Pinterest in system browser */}
          {onSteal && (
            <>
              <button
                data-testid="steal-from-pinterest"
                onClick={() => setShowStealMenu(!showStealMenu)}
                className="w-full text-[10px] font-semibold px-2 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #E60023 0%, #BD081C 50%, #C92228 100%)' }}
              >
                {t('panel.browsePinterest')}
              </button>
              {showStealMenu && (
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 overflow-hidden shadow-lg">
                  {[
                    { label: t('panel.webHomepage'), query: 'homepage web design ui' },
                    { label: t('panel.dashboardDesign'), query: 'dashboard design ui ux' },
                    { label: t('panel.iphoneDesign'), query: 'iphone app design ui' },
                    { label: t('panel.androidDesign'), query: 'android app design ui' },
                    { label: t('panel.ipadDesign'), query: 'ipad app design ui' },
                  ].map(({ label, query }) => (
                    <button
                      key={query}
                      data-testid={`steal-category-${query.split(' ')[0]}`}
                      onClick={() => { onSteal(query); setShowStealMenu(false) }}
                      className="w-full text-left text-[10px] px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-b-0"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2: Paste image URL */}
          {onStealUrl && (
            <div className="space-y-1">
              <p className="text-[9px] text-neutral-400">{t('panel.stealInstruction')}</p>
              <div className="flex gap-1">
                <input
                  data-testid="steal-url-input"
                  type="text"
                  placeholder={t('panel.pasteImageUrl')}
                  value={stealUrlValue}
                  onChange={(e) => setStealUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && stealUrlValue.trim() && !stealUrlLoading) {
                      setStealUrlLoading(true)
                      onStealUrl(stealUrlValue.trim())
                      setStealUrlValue('')
                    }
                  }}
                  className="flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 outline-none focus:border-blue-400"
                  disabled={stealUrlLoading}
                />
                <button
                  data-testid="steal-url-submit"
                  onClick={() => {
                    if (stealUrlValue.trim() && !stealUrlLoading) {
                      setStealUrlLoading(true)
                      onStealUrl(stealUrlValue.trim())
                      setStealUrlValue('')
                    }
                  }}
                  disabled={!stealUrlValue.trim() || stealUrlLoading}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-all hover:opacity-90 flex items-center gap-1"
                  style={{ background: '#7c3aed' }}
                >
                  {stealUrlLoading ? (
                    <><svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" /><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Analyzing...</>
                  ) : t('panel.steal')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colors */}
      <div>
        <SectionLabel>{t('panel.colorPalette')}</SectionLabel>
        <div className="space-y-3 mt-2">
          {colorRoles.map((role) => (
            <div key={role.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-neutral-500">{role.label}</span>
                <button
                  onClick={() => onCopy(role.base)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-600 font-mono"
                >
                  {copiedValue === role.base ? t('common.copied') : role.base}
                </button>
              </div>
              <div className="flex gap-px rounded-lg overflow-hidden">
                {role.tones.map((tone, i) => {
                  const isEditing = editingColor?.role === role.roleKey && editingColor.index === i
                  return isEditing ? (
                    <div key={i} className="flex-1 relative z-30">
                      <input
                        data-testid={`color-edit-${role.label.toLowerCase()}-${i}`}
                        autoFocus
                        value={colorValue}
                        onChange={(e) => setColorValue(e.target.value)}
                        onBlur={saveColorEdit}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveColorEdit(); if (e.key === 'Escape') setEditingColor(null); }}
                        className="w-full h-6 text-[9px] text-center font-mono border border-blue-400 outline-none bg-white dark:bg-neutral-800"
                        style={{ color: tone }}
                      />
                    </div>
                  ) : (
                    <button
                      key={i}
                      onClick={(e) => {
                        if (e.shiftKey) { onCopy(tone); return }
                        if (onDesignSystemUpdate) { setEditingColor({ role: role.roleKey, index: i }); setColorValue(tone); }
                        else { onCopy(tone) }
                      }}
                      className="flex-1 h-6 hover:ring-2 hover:ring-blue-400 hover:z-10 relative group transition-all"
                      style={{ backgroundColor: tone }}
                      title={`${TONE_LABELS[i]}: ${tone} (click to edit, shift+click to copy)`}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[9px] bg-neutral-900 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-30 shadow-lg">
                        {TONE_LABELS[i]} {tone}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <SectionLabel>{t('panel.typography')}</SectionLabel>
        <div className="mt-2 space-y-2">
          {Object.entries(designSystem.typography).map(([level, typo]) => {
            const family = typo.family
            return (
            <div key={level} className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg px-3 py-2 group">
              <div className="flex items-center justify-between">
                {editingFont === level ? (
                  <select
                    data-testid={`font-select-${level}`}
                    autoFocus
                    value={fontValue}
                    onChange={(e) => { setFontValue(e.target.value); }}
                    onBlur={saveFontEdit}
                    className="flex-1 text-[11px] bg-white dark:bg-neutral-700 border border-blue-400 rounded-md px-1.5 py-0.5 outline-none mr-2"
                  >
                    {!(GOOGLE_FONTS_LIST as readonly string[]).includes(fontValue) && <option value={fontValue}>{fontValue}</option>}
                    {GOOGLE_FONTS_LIST.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    className="text-left flex-1"
                    onClick={() => { if (onDesignSystemUpdate) { setEditingFont(level); setFontValue(family); } }}
                    title={t('panel.editFontFamily')}
                  >
                    <span className="text-[11px] font-medium text-neutral-500 capitalize">{level}</span>
                    <span className="text-[11px] text-neutral-400 ml-1.5 group-hover:text-blue-500 transition-colors">{family}</span>
                  </button>
                )}
                <span className="text-lg font-semibold" style={{ fontFamily: editingFont === level ? fontValue : family }}>Aa</span>
              </div>
              {(typo.size || typo.weight || typo.lineHeight) && (
                <div className="mt-0.5 flex gap-2 text-[9px] text-neutral-400">
                  {typo.size && <span>{typo.size}</span>}
                  {typo.weight && <span>w{typo.weight}</span>}
                  {typo.lineHeight && <span>lh {typo.lineHeight}</span>}
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      {/* Design Guide */}
      <div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full group"
        >
          <SectionLabel>{t('panel.designGuide')}</SectionLabel>
          <ChevronIcon className={`w-3 h-3 text-neutral-400 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>

        {showGuide && (
          <div className="mt-2 space-y-2">
            {designSystem.guide ? (
              GUIDE_SECTIONS.map(({ key, labelKey, icon }) => (
                <div key={key} className="rounded-lg bg-neutral-50 dark:bg-neutral-700/50 overflow-hidden">
                  {editingGuideKey === key ? (
                    <div className="p-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px]">{icon}</span>
                        <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">{t(labelKey)}</span>
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
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600"
                        >
                          {t('common.save')}
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
                          <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">{t(labelKey)}</span>
                        </div>
                        <EditSmallIcon className="w-3 h-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-3">
                        {designSystem.guide?.[key] || t('panel.clickToAdd')}
                      </p>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[11px] text-neutral-400 text-center py-3">
                {t('panel.guideWillBeGenerated')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Code snippets for each component type
// === Components Tab ===
function ComponentsTab({ designSystem }: { designSystem: DesignSystem }) {
  const { t } = useI18n()
  const { colors, typography, components: ct } = designSystem
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const btnR = ct?.buttonRadius || '9999px'
  const btnP = ct?.buttonPadding || '8px 20px'
  const btnW = ct?.buttonFontWeight || '600'
  const inpR = ct?.inputRadius || '8px'
  const inpB = ct?.inputBorder || `1px solid ${colors.neutral.tones[7] || '#ccc'}`
  const inpP = ct?.inputPadding || '10px 14px'
  const inpBg = ct?.inputBg || colors.neutral.tones[11] || '#fff'
  const cardR = ct?.cardRadius || '12px'
  const cardS = ct?.cardShadow || '0 2px 8px rgba(0,0,0,0.08)'
  const cardP = ct?.cardPadding || '16px'
  const chipR = ct?.chipRadius || '9999px'
  const chipP = ct?.chipPadding || '4px 12px'
  const chipBg = ct?.chipBg || colors.neutral.tones[10] || '#f0f0f0'
  const fabSz = ct?.fabSize || '48px'
  const fabR = ct?.fabRadius || '16px'

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedSnippet(key)
    setTimeout(() => setCopiedSnippet(null), 1500)
  }

  const CopyBtn = ({ id, code }: { id: string; code: string }) => (
    <button
      data-testid={`copy-${id}`}
      onClick={() => copyCode(code, id)}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-neutral-400 hover:text-blue-500 shrink-0"
      title={t('panel.copySnippet')}
    >{copiedSnippet === id ? '✓' : '{ }'}</button>
  )

  return (
    <div className="p-3 space-y-5">
      {/* Typography */}
      <div>
        <SectionLabel>{t('components.typography')}</SectionLabel>
        <div className="mt-2 space-y-2.5">
          {(['headline', 'body', 'label'] as const).map((level) => {
            const typoLevel = typography[level]
            return (
              <div key={level} className="group flex items-baseline gap-2" data-testid={`typo-${level}`}>
                <div className="flex-1 min-w-0">
                  <span
                    className="block truncate"
                    style={{
                      fontFamily: typoLevel.family,
                      fontSize: level === 'headline' ? (typoLevel.size || '24px') : level === 'body' ? (typoLevel.size || '14px') : (typoLevel.size || '11px'),
                      fontWeight: typoLevel.weight || (level === 'headline' ? '700' : '400'),
                      lineHeight: typoLevel.lineHeight || '1.4',
                    }}
                  >
                    {typoLevel.family}
                  </span>
                  <span className="text-[9px] text-neutral-400 capitalize">
                    {level} &middot; {typoLevel.size || (level === 'headline' ? '32px' : level === 'body' ? '16px' : '12px')} &middot; {typoLevel.weight || (level === 'headline' ? '700' : '400')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Buttons */}
      <div>
        <SectionLabel>{t('components.buttons')}</SectionLabel>
        <div className="mt-2 space-y-2">
          {[
            { id: 'btn-primary', label: t('components.primary'), bg: colors.primary.base, fg: '#fff' },
            { id: 'btn-secondary', label: t('components.secondary'), bg: colors.secondary.base, fg: '#fff' },
            { id: 'btn-tertiary', label: t('components.tertiary'), bg: colors.tertiary.base, fg: '#fff' },
            { id: 'btn-outlined', label: t('components.outlined'), bg: 'transparent', fg: colors.primary.base, border: `1px solid ${colors.primary.base}` },
          ].map(({ id, label, bg, fg, border }) => (
            <div key={id} className="group flex items-center gap-2" data-testid={`component-${id}`}>
              <button
                className="text-xs transition-all hover:scale-105 hover:shadow-md active:scale-95 active:opacity-80"
                style={{
                  backgroundColor: bg,
                  color: fg,
                  padding: btnP,
                  borderRadius: btnR,
                  fontWeight: btnW,
                  border: border || 'none',
                  cursor: 'pointer',
                  fontFamily: typography.label.family,
                }}
              >
                {label}
              </button>
              <CopyBtn id={id} code={`<button style="background:${bg};color:${fg};padding:${btnP};border-radius:${btnR};font-weight:${btnW};border:${border || 'none'};font-family:${typography.label.family}">${label}</button>`} />
            </div>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div>
        <SectionLabel>{t('components.textInput')}</SectionLabel>
        <div className="mt-2 space-y-2">
          <div className="group relative" data-testid="component-input">
            <input
              type="text"
              placeholder={t('components.enterText')}
              readOnly
              className="w-full text-xs outline-none"
              style={{
                padding: inpP,
                borderRadius: inpR,
                border: inpB,
                backgroundColor: inpBg,
                fontFamily: typography.body.family,
              }}
            />
            <CopyBtn id="input" code={`<input type="text" placeholder="Enter text..." style="padding:${inpP};border-radius:${inpR};border:${inpB};background:${inpBg};font-family:${typography.body.family}" />`} />
          </div>
          <div className="group relative" data-testid="component-input-label">
            <label
              className="block text-neutral-500 dark:text-neutral-400 mb-1"
              style={{ fontSize: typography.label.size || '12px', fontFamily: typography.label.family, fontWeight: typography.label.weight || '500' }}
            >{t('components.label')}</label>
            <input
              type="text"
              placeholder={t('components.withLabel')}
              readOnly
              className="w-full text-xs outline-none"
              style={{
                padding: inpP,
                borderRadius: inpR,
                border: inpB,
                backgroundColor: inpBg,
                fontFamily: typography.body.family,
              }}
            />
          </div>
        </div>
      </div>

      {/* Card */}
      <div>
        <SectionLabel>{t('components.card')}</SectionLabel>
        <div className="mt-2 group" data-testid="component-card">
          <div
            className="bg-white dark:bg-neutral-800"
            style={{ borderRadius: cardR, boxShadow: cardS, padding: cardP }}
          >
            <div className="font-semibold text-xs mb-1" style={{ fontFamily: typography.headline.family }}>{t('components.cardTitle')}</div>
            <div className="text-[10px] text-neutral-500" style={{ fontFamily: typography.body.family }}>{t('components.cardDesc')}</div>
            <button
              className="mt-2 text-[10px] text-white"
              style={{ backgroundColor: colors.primary.base, padding: '4px 12px', borderRadius: btnR, fontFamily: typography.label.family, border: 'none' }}
            >{t('components.action')}</button>
          </div>
          <CopyBtn id="card" code={`<div style="border-radius:${cardR};box-shadow:${cardS};padding:${cardP};background:#fff"><h3>Card Title</h3><p>Description</p></div>`} />
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <SectionLabel>{t('components.searchBar')}</SectionLabel>
        <div className="mt-2 group relative" data-testid="component-search-bar">
          <div
            className="flex items-center gap-2.5 text-neutral-400 text-xs"
            style={{ padding: inpP, borderRadius: inpR, backgroundColor: chipBg, fontFamily: typography.body.family }}
          >
            <SearchSmallIcon />
            <span>{t('components.searchPlaceholder')}</span>
          </div>
          <CopyBtn id="search-bar" code={`<div style="display:flex;align-items:center;gap:8px;padding:${inpP};border-radius:${inpR};background:${chipBg}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>Search</div>`} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div>
        <SectionLabel>{t('components.bottomNav')}</SectionLabel>
        <div className="mt-2 flex justify-around rounded-xl py-2.5 px-4" style={{ backgroundColor: chipBg }}>
          <NavItem icon="home" label={t('components.home')} active color={colors.primary.base} />
          <NavItem icon="search" label={t('common.search')} />
          <NavItem icon="person" label={t('components.profile')} />
        </div>
      </div>

      {/* FAB */}
      <div>
        <SectionLabel>{t('components.fab')}</SectionLabel>
        <div className="mt-2 flex items-center gap-3 group" data-testid="component-fab">
          <button
            className="text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ width: fabSz, height: fabSz, borderRadius: fabR, backgroundColor: colors.primary.base, border: 'none' }}
          >
            <EditIcon />
          </button>
          <span className="text-[11px] text-neutral-400">{t('components.fabCaption')}</span>
          <CopyBtn id="fab" code={`<button style="width:${fabSz};height:${fabSz};border-radius:${fabR};background:${colors.primary.base};color:#fff;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.15)">+</button>`} />
        </div>
      </div>

      {/* Chips */}
      <div>
        <SectionLabel>{t('components.chips')}</SectionLabel>
        <div className="mt-2 flex gap-2 flex-wrap" data-testid="component-chips">
          {[
            { label: t('components.primary'), bg: colors.primary.tones[9] || chipBg, fg: colors.primary.base },
            { label: t('components.secondary'), bg: colors.secondary.tones[9] || chipBg, fg: colors.secondary.base },
            { label: t('components.default'), bg: chipBg, fg: undefined },
            { label: t('components.outlined'), bg: 'transparent', fg: undefined, border: `1px solid ${colors.neutral.tones[7] || '#ccc'}` },
          ].map(({ label, bg, fg, border }) => (
            <span
              key={label}
              className="inline-flex items-center text-xs cursor-pointer hover:ring-1 hover:ring-blue-400 transition-all"
              style={{
                padding: chipP,
                borderRadius: chipR,
                backgroundColor: bg,
                color: fg,
                border: border || 'none',
                fontFamily: typography.label.family,
              }}
            >{label}</span>
          ))}
        </div>
      </div>

      {/* Icon Set */}
      <div>
        <SectionLabel>{t('components.iconSet')}</SectionLabel>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {['home','search','person','edit','star','chat','attach_file','settings','add','delete','bookmark','share'].map((name) => (
            <div key={name} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 text-[10px] hover:ring-1 hover:ring-blue-400 transition-all cursor-pointer" style={{ backgroundColor: chipBg }} title={name}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={getIconPath(name)} /></svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getIconPath(name: string): string {
  const paths: Record<string, string> = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z',
    attach_file: 'M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6h-1.5z',
    settings: 'M19.14 12.94a7.07 7.07 0 0 0 .06-.94c0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    bookmark: 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z',
    share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 1 0 14.5 5c0 .24.04.47.09.7L7.54 9.81A2.99 2.99 0 0 0 2 12a3 3 0 0 0 5.54 1.59l7.13 4.15c-.05.21-.08.43-.08.66a2.99 2.99 0 1 0 3.41-2.32z',
  }
  return paths[name] || ''
}

// === Layers Tab ===
function LayersTab({ screenNames, selectedScreen, onSelectScreen }: {
  screenNames: string[]; selectedScreen: string | null; onSelectScreen: (name: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="p-3 space-y-1">
      <SectionLabel>{t('panel.screensCount', { count: String(screenNames.length) })}</SectionLabel>
      {screenNames.length === 0 ? (
        <p className="text-xs text-neutral-400 mt-2">{t('panel.noScreens')}</p>
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
