import { useState, useRef, useCallback, useEffect } from 'react'
import type { Project, Screen, DesignSystem, HeatmapZone } from '../App'
import { PromptBar } from '../components/common/PromptBar'
import { AppearanceToggle } from '../components/common/AppearanceToggle'
import { AgentLog } from '../components/editor/AgentLog'
import { ScreenContextToolbar, ScreenContextMenu } from '../components/editor/ScreenContextToolbar'
import { RightPanel } from '../components/editor/RightPanel'
import { generateDesign, generateMultiScreen, editDesign, generateDesignSystem, generateHeatmap, generateFrontendApp, generateIncrementalFrontend, editFrontendFile, fixBuildErrors, hashString, analyzeDesignFromImage } from '../lib/gemini'
import { DEFAULT_DESIGN_GUIDE } from '../lib/default-design-guide'
import { designGuideDB } from '../lib/design-guide-db'
import { useI18n } from '../lib/i18n'
import { paraphraseLiveEditForDesigner, paraphraseLiveEditFailure } from '../lib/gemini'
import { generatePrdPrompt } from '../lib/prd-generator'
import { buildLiveEditDeveloperMarkdown } from '../lib/live-diff'

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
    headline: { family: '...', size: '32px', weight: '700', lineHeight: '1.2' },
    body: { family: '...', size: '16px', weight: '400', lineHeight: '1.5' },
    label: { family: '...', size: '12px', weight: '500', lineHeight: '1.4' },
  },
  components: {
    buttonRadius: '8px', buttonPadding: '10px 20px', buttonFontWeight: '600',
    inputRadius: '8px', inputBorder: '1px solid #ccc', inputPadding: '10px 14px', inputBg: '#ffffff',
    cardRadius: '12px', cardShadow: '0 2px 8px rgba(0,0,0,0.08)', cardPadding: '16px',
    chipRadius: '9999px', chipPadding: '4px 12px', chipBg: '#f0f0f0',
    fabSize: '48px', fabRadius: '16px',
  },
}

export function Editor({ project, onBack, onProjectUpdate, onOpenSettings }: EditorProps) {
  const { t, locale, setLocale } = useI18n()
  const [zoom, setZoom] = useState(100)
  const [isRunning, setIsRunning] = useState(false)
  const [showHamburger, setShowHamburger] = useState(false)
  const [deviceType, setDeviceType] = useState<'app' | 'web' | 'tablet'>(project.deviceType)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'auto'>(project.designSystem?.colorScheme || 'auto')

  // Left toolbar active tool
  type CanvasTool = 'cursor' | 'select' | 'element' | 'image'
  const [activeTool, setActiveTool] = useState<CanvasTool>('cursor')

  // Multi-screen selection helpers
  const toggleScreenInSelection = (name: string) => {
    setSelectedScreens(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const clearMultiSelection = () => {
    setSelectedScreens(new Set())
  }

  const handleScreenClick = (screenName: string) => {
    if (activeTool === 'select') {
      // Multi-select mode: toggle screen in selection set
      toggleScreenInSelection(screenName)
      setSelectedScreen(screenName)
    } else if (activeTool === 'element') {
      // Element mode: select screen + enter edit mode
      setSelectedScreen(screenName)
      setSelectedScreens(new Set())
      setEditMode(true)
    } else {
      // Cursor mode: single select
      setSelectedScreen(selectedScreen === screenName ? null : screenName)
      setSelectedScreens(new Set())
      setEditMode(false)
      setSelectedElement(null)
    }
  }
  const [agentLogOpen, setAgentLogOpen] = useState(true)
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null)
  const [selectedScreens, setSelectedScreens] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [logEntries, setLogEntries] = useState<AgentLogEntry[]>([])
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<{
    cssPath: string
    tagName: string
    textPreview: string
    outerHtml: string
  } | null>(null)
  const [heatmapMode, setHeatmapMode] = useState(false)
  const [heatmapData, setHeatmapData] = useState<Map<string, HeatmapZone[]>>(new Map())
  const [heatmapLoading, setHeatmapLoading] = useState(false)
  const [heatmapActionMenu, setHeatmapActionMenu] = useState<{
    zone: HeatmapZone; screenName: string; x: number; y: number
  } | null>(null)
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null)
  const [buildingFrontend, setBuildingFrontend] = useState(false)
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [projectNameValue, setProjectNameValue] = useState(project.name)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(40)
  const sidebarResizing = useRef(false)
  const lastLiveErrorRef = useRef(0)

  // §11.1 Designer / Developer feedback mode
  type FeedbackMode = 'designer' | 'developer'
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>(() => {
    return (localStorage.getItem('vibesynth-live-feedback-mode') as FeedbackMode) || 'designer'
  })
  const [devMarkdown, setDevMarkdown] = useState<string | null>(null)

  const toggleFeedbackMode = () => {
    const next = feedbackMode === 'designer' ? 'developer' : 'designer'
    setFeedbackMode(next)
    localStorage.setItem('vibesynth-live-feedback-mode', next)
  }
  const canvasRef = useRef<HTMLDivElement>(null)
  const autoZoomDone = useRef(false)
  // Incremental build cache: screenId → { htmlHash, generatedFiles }
  const buildCacheRef = useRef<Map<string, { htmlHash: string; files: Record<string, string> }>>(new Map())

  // Canvas pan state
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })

  const designSystem = project.designSystem || PLACEHOLDER_DESIGN_SYSTEM

  // Auto-generate initial screen if project has no screens (just created from dashboard)
  // Auto-save project to DB when screens/designSystem change
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (project.screens.length === 0) return
    // Debounce save — wait 2s after last change
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      window.electronAPI?.db.saveProject({
        ...project,
        userId: 'default',
        createdAt: project.updatedAt,
      }).catch(() => {})
    }, 2000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [project.screens, project.designSystem, project.updatedAt, project.name]) // eslint-disable-line react-hooks/exhaustive-deps

  const initialGenerationDone = useRef(false)
  const prevScreenCount = useRef(project.screens.length)
  useEffect(() => {
    if (project.screens.length === 0 && !initialGenerationDone.current) {
      initialGenerationDone.current = true
      handlePromptSubmit(project.prompt || project.name)
    }
    if (project.screens.length !== prevScreenCount.current) {
      prevScreenCount.current = project.screens.length
      autoZoomDone.current = false
    }
  }, [project.screens.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for live window close events from main process
  useEffect(() => {
    const cleanup = window.electronAPI?.onLiveWindowClosed(() => {
      setIsRunning(false)
    })

    // Catch Live App errors and auto-fix via LLM
    const errorCleanup = window.electronAPI?.onLiveAppError?.(async (errorMsg: string) => {
      if (!devServerUrl || !project.id || isGenerating) return
      // Debounce: ignore repeated errors within 10s
      const now = Date.now()
      if (now - lastLiveErrorRef.current < 10_000) return
      lastLiveErrorRef.current = now

      addLog(`Live app error detected: ${errorMsg.slice(0, 100)}`, 'error')

      try {
        const targetFile = 'src/App.tsx'
        const content = await window.electronAPI?.project.readFile(project.id, targetFile)
        if (!content) return

        const fixed = await editFrontendFile(targetFile, content, `Fix this runtime error: ${errorMsg}`, {
          files: project.screens.map(s => `src/pages/${s.name.replace(/\s+/g, '')}.tsx`),
          screens: project.screens.map(s => s.name),
        })

        await window.electronAPI?.project.writeFile(project.id, targetFile, fixed)
        addLog('Auto-fixed Live app error via AI', 'success')
      } catch {
        addLog('Could not auto-fix Live app error', 'error')
      }
    })

    return () => { cleanup?.(); errorCleanup?.() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup dev server when leaving the editor
  useEffect(() => {
    return () => {
      window.electronAPI?.project.stopDev()
    }
  }, [])

  // Sync current screen HTML to live window when screens update (only for single-screen data URL mode)
  useEffect(() => {
    if (!isRunning || devServerUrl) return
    const screen = selectedScreen
      ? project.screens.find((s) => s.name === selectedScreen)
      : project.screens[0]
    if (screen) {
      window.electronAPI?.updateLiveWindow(screen.html)
    }
  }, [project.screens, selectedScreen, isRunning, devServerUrl])

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

    const logId = addLog(t('editor.log.generatingDesign', { prompt }), 'generating')
    let imgLogId: string | null = null

    // Pre-create placeholder screen with generating=true
    const placeholderId = crypto.randomUUID()
    const screenName = prompt.split(/\s+/).slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    const placeholder: Screen = { id: placeholderId, name: screenName, html: '', generating: true }
    onProjectUpdate({
      ...project,
      screens: [...project.screens, placeholder],
      updatedAt: new Date().toLocaleDateString(),
    })

    try {
      const existingRefHtml = project.screens.length > 0 ? project.screens[0].html : undefined
      const results = await generateDesign(prompt, deviceType, activeGuide, {
        onImageGenStart: () => {
          imgLogId = addLog(t('editor.log.generatingImages'), 'generating')
        },
        onImageGenComplete: (count) => {
          if (imgLogId) updateLog(imgLogId, t('editor.log.imagesGenerated', { count }), 'success')
        },
        onDesignGenStart: () => {
          updateLog(logId, t('editor.log.generatingLayout', { prompt }), 'generating')
        },
        onDesignGenComplete: () => {
          updateLog(logId, t('editor.log.layoutDone'), 'generating')
        },
      }, existingRefHtml, project.designSystem)

      const r = results[0]
      const finishedScreen: Screen = { id: placeholderId, name: r.screenName, html: r.html }
      const updatedScreens = [...project.screens, finishedScreen]

      updateLog(logId, t('editor.log.screenGenerated', { name: r.screenName }), 'success')

      if (!project.designSystem) {
        // DS가 없을 때만 AI로 추출 — DS가 이미 선택되어 있으면 건너뜀
        const dsLogId = addLog(t('editor.log.extractingDS'), 'generating')
        try {
          const ds = await generateDesignSystem(r.html, activeGuide)
          updateLog(dsLogId, t('editor.log.dsExtracted', { name: ds.name }), 'success')
          if (ds.guide) {
            designGuideDB.saveFromGeneration(project.name, prompt, ds.guide)
          }
          onProjectUpdate({
            ...project,
            screens: updatedScreens,
            designSystem: ds,
            updatedAt: new Date().toLocaleDateString(),
          })
        } catch {
          updateLog(dsLogId, t('editor.log.dsExtractFail'), 'error')
          onProjectUpdate({
            ...project,
            screens: updatedScreens,
            updatedAt: new Date().toLocaleDateString(),
          })
        }
      } else {
        onProjectUpdate({
          ...project,
          screens: updatedScreens,
          updatedAt: new Date().toLocaleDateString(),
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateLog(logId, t('editor.log.genFailed', { error: message }), 'error')
      // Remove placeholder on failure
      onProjectUpdate({
        ...project,
        screens: project.screens.filter(s => s.id !== placeholderId),
        updatedAt: new Date().toLocaleDateString(),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateMultiScreen = async (appDescription: string, screenNames: string[]) => {
    if (isGenerating) return
    setIsGenerating(true)
    setAgentLogOpen(true)

    const logId = addLog(t('editor.log.generatingScreens', { count: screenNames.length, names: screenNames.join(', ') }), 'generating')
    let imgLogId: string | null = null

    // Pre-create placeholder screens with generating=true so they appear on canvas immediately
    const placeholderIds = screenNames.map(() => crypto.randomUUID())
    const placeholderScreens: Screen[] = screenNames.map((name, i) => ({
      id: placeholderIds[i],
      name,
      html: '',
      generating: true,
    }))
    onProjectUpdate({
      ...project,
      screens: [...project.screens, ...placeholderScreens],
      updatedAt: new Date().toLocaleDateString(),
    })

    // We need a mutable ref to track the latest project state since onProjectUpdate is async
    let latestScreens = [...project.screens, ...placeholderScreens]
    let firstScreenHtml = ''

    try {
      await generateMultiScreen(appDescription, screenNames, deviceType, activeGuide, {
        onImageGenStart: () => {
          imgLogId = addLog(t('editor.log.generatingImages'), 'generating')
        },
        onImageGenComplete: (count) => {
          if (imgLogId) updateLog(imgLogId, t('editor.log.imagesGenerated', { count }), 'success')
        },
        onDesignGenStart: () => {
          updateLog(logId, t('editor.log.generatingScreens', { count: screenNames.length, names: screenNames.join(', ') }), 'generating')
        },
        onDesignGenComplete: () => {
          updateLog(logId, t('editor.log.allScreensDone', { count: screenNames.length }), 'success')
        },
        onScreenComplete: (i, total, name, html) => {
          addLog(t('editor.log.screenDone', { index: i, total, name }), 'success')
          if (i === 1) firstScreenHtml = html

          latestScreens = latestScreens.map(s =>
            s.id === placeholderIds[i - 1]
              ? { ...s, html, generating: false }
              : s
          )
          onProjectUpdate({
            ...project,
            screens: latestScreens,
            updatedAt: new Date().toLocaleDateString(),
          })
        },
      }, project.designSystem)

      // Extract design system from first screen — ONLY if no DS was pre-selected
      if (!project.designSystem && firstScreenHtml) {
        const dsLogId = addLog(t('editor.log.extractingDS'), 'generating')
        try {
          const ds = await generateDesignSystem(firstScreenHtml, activeGuide)
          updateLog(dsLogId, t('editor.log.dsExtracted', { name: ds.name }), 'success')
          if (ds.guide) {
            designGuideDB.saveFromGeneration(project.name, appDescription, ds.guide)
          }
          onProjectUpdate({
            ...project,
            screens: latestScreens,
            designSystem: ds,
            updatedAt: new Date().toLocaleDateString(),
          })
        } catch {
          updateLog(dsLogId, t('editor.log.dsExtractFail'), 'error')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateLog(logId, t('editor.log.multiScreenFailed', { error: message }), 'error')
      // Remove any remaining placeholder screens on failure
      latestScreens = latestScreens.filter(s => !s.generating)
      onProjectUpdate({
        ...project,
        screens: latestScreens,
        updatedAt: new Date().toLocaleDateString(),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper: set screen(s) to blur state during LLM processing
  const setScreensGenerating = (screenIds: string[], generating: boolean) => {
    const updated = project.screens.map(s =>
      screenIds.includes(s.id) ? { ...s, generating } : s
    )
    onProjectUpdate({ ...project, screens: updated })
  }

  const handleEditScreen = async (prompt: string) => {
    if (isGenerating || !selectedScreen) return

    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return

    // Detect if this is a global edit (color/theme/font changes should propagate)
    const isGlobalEdit = detectGlobalEdit(prompt)

    setIsGenerating(true)
    setAgentLogOpen(true)

    if (isGlobalEdit && project.screens.length > 1) {
      // ─── Batch edit: apply to all screens ───
      setScreensGenerating(project.screens.map(s => s.id), true) // blur all
      const logId = addLog(t('editor.log.batchEditing', { count: project.screens.length, prompt }), 'generating')

      try {
        const editPromises = project.screens.map(async (s) => {
          const newHtml = await editDesign(s.html, prompt)
          return { ...s, html: newHtml, generating: false }
        })

        const updatedScreens = await Promise.all(editPromises)
        updateLog(logId, t('editor.log.batchUpdated', { count: updatedScreens.length }), 'success')

        const dsLogId = addLog(t('editor.log.updatingDS'), 'generating')
        try {
          const ds = await generateDesignSystem(updatedScreens[0].html, activeGuide)
          updateLog(dsLogId, t('editor.log.dsUpdated', { name: ds.name }), 'success')
          if (ds.guide) {
            designGuideDB.saveFromGeneration(project.name, prompt, ds.guide)
          }
          onProjectUpdate({
            ...project,
            screens: updatedScreens,
            designSystem: ds,
            updatedAt: new Date().toLocaleDateString(),
          })
        } catch {
          updateLog(dsLogId, t('editor.log.dsUpdateSkipped'), 'info')
          onProjectUpdate({
            ...project,
            screens: updatedScreens,
            updatedAt: new Date().toLocaleDateString(),
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        updateLog(logId, t('editor.log.batchFailed', { error: message }), 'error')
      } finally {
        setIsGenerating(false)
      }
    } else {
      // ─── Single screen edit ───
      setScreensGenerating([screen.id], true) // blur this screen
      const logId = addLog(t('editor.log.editing', { screen: screen.name, prompt }), 'generating')

      try {
        const newHtml = await editDesign(screen.html, prompt)
        updateLog(logId, t('editor.log.updatedScreen', { name: screen.name }), 'success')

        const updatedScreens = project.screens.map((s) =>
          s.id === screen.id ? { ...s, html: newHtml, generating: false } : s
        )
        onProjectUpdate({
          ...project,
          screens: updatedScreens,
          updatedAt: new Date().toLocaleDateString(),
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        updateLog(logId, t('editor.log.editFailed', { error: message }), 'error')
      } finally {
        setIsGenerating(false)
      }
    }
  }

  /**
   * Detect if an edit prompt is a global change that should propagate
   * across all screens (e.g., color, theme, font changes).
   */
  function detectGlobalEdit(prompt: string): boolean {
    const globalKeywords = [
      'color', 'colour', 'theme', 'accent', 'palette', 'font', 'typography',
      'dark mode', 'light mode', 'dark theme', 'light theme',
      'background', 'style', 'redesign', 'rebrand',
      'all screens', 'every screen', 'entire', 'global',
    ]
    const p = prompt.toLowerCase()
    return globalKeywords.some(kw => p.includes(kw))
  }

  const handleElementEdit = async (prompt: string) => {
    if (isGenerating || !selectedScreen || !selectedElement) return
    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return

    setIsGenerating(true)
    setAgentLogOpen(true)
    setScreensGenerating([screen.id], true) // blur
    const logId = addLog(t('editor.log.editingElement', { tag: selectedElement.tagName, screen: screen.name, prompt }), 'generating')

    try {
      const { editDesignElement } = await import('../lib/gemini')
      const newHtml = await editDesignElement(screen.html, selectedElement.cssPath, selectedElement.outerHtml, prompt)
      updateLog(logId, t('editor.log.updatedElement', { name: screen.name }), 'success')

      const updatedScreens = project.screens.map((s) =>
        s.id === screen.id ? { ...s, html: newHtml, generating: false } : s
      )
      onProjectUpdate({ ...project, screens: updatedScreens, updatedAt: new Date().toLocaleDateString() })
      setSelectedElement(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateLog(logId, t('editor.log.elementEditFailed', { error: message }), 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleHeatmap = async () => {
    if (heatmapMode) {
      setHeatmapMode(false)
      setHeatmapActionMenu(null)
      addLog(t('editor.log.exitedHeatmap'), 'info')
      return
    }

    if (!selectedScreen) {
      addLog(t('editor.log.selectScreenFirst'), 'info')
      return
    }

    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return

    if (heatmapData.has(screen.id)) {
      setHeatmapMode(true)
      addLog(t('editor.log.cachedHeatmap', { name: screen.name }), 'info')
      return
    }

    setHeatmapLoading(true)
    setAgentLogOpen(true)
    const logId = addLog(t('editor.log.generatingHeatmap', { name: screen.name }), 'generating')

    try {
      const zones = await generateHeatmap(screen.html)
      updateLog(logId, t('editor.log.heatmapDone', { count: zones.length }), 'success')

      const resolvedZones: HeatmapZone[] = zones.map((z) => ({
        ...z,
        rect: { x: 0, y: 0, w: 0, h: 0 },
      }))

      setHeatmapData((prev) => new Map(prev).set(screen.id, resolvedZones))
      setHeatmapMode(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateLog(logId, t('editor.log.heatmapFailed', { error: message }), 'error')
    } finally {
      setHeatmapLoading(false)
    }
  }

  const handleHeatmapAction = async (action: string, zone: HeatmapZone, screenName: string) => {
    setHeatmapActionMenu(null)
    const screen = project.screens.find((s) => s.name === screenName)
    if (!screen || isGenerating) return

    setIsGenerating(true)
    setAgentLogOpen(true)

    const logId = addLog(t('editor.log.applyingAction', { action, tag: zone.tagName, text: zone.label, screen: screenName }), 'generating')

    try {
      // For CSS-only actions (hover, click, focus, micro-animation), inject CSS directly
      // without a Gemini round-trip. This is instant and reliable.
      const cssOnlyActions: Record<string, (selector: string) => string> = {
        'hover-effect': (sel) => `${sel}{transition:all 0.2s ease;cursor:pointer;}${sel}:hover{transform:scale(1.03);box-shadow:0 4px 15px rgba(0,0,0,0.12);}`,
        'click-animation': (sel) => `${sel}{transition:transform 0.15s ease;cursor:pointer;}${sel}:active{transform:scale(0.97);}`,
        'focus-state': (sel) => `${sel}:focus-visible{outline:2px solid ${project.designSystem?.colors?.primary?.base || '#3b82f6'};outline-offset:2px;border-radius:4px;}`,
        'micro-animation': (sel) => `@keyframes vs-pulse{0%,100%{opacity:1;}50%{opacity:0.85;}}${sel}{animation:vs-pulse 2s ease-in-out infinite;}`,
      }

      const cssGenerator = cssOnlyActions[action]
      if (cssGenerator) {
        // Generate a unique class-based selector to avoid CSS specificity issues
        const uid = `vs-fx-${Date.now().toString(36)}`
        const cssRule = cssGenerator(`.${uid}`)

        let newHtml = screen.html
        // Inject CSS rule into <style> or create a new <style> block
        const styleTag = `<style data-vs-effect>${cssRule}</style>`
        if (newHtml.includes('</head>')) {
          newHtml = newHtml.replace('</head>', styleTag + '</head>')
        } else if (newHtml.includes('</style>')) {
          newHtml = newHtml.replace(/<\/style>/, `</style>${styleTag}`)
        } else {
          newHtml = styleTag + newHtml
        }

        // Add the class to the target element
        const doc = new DOMParser().parseFromString(newHtml, 'text/html')
        const el = doc.querySelector(zone.cssPath)
        if (el) {
          el.classList.add(uid)
          if (action === 'focus-state' && !el.hasAttribute('tabindex')) {
            el.setAttribute('tabindex', '0')
          }
          newHtml = '<!DOCTYPE html>' + doc.documentElement.outerHTML
        }

        updateLog(logId, `Applied "${action}" to <${zone.tagName}> in ${screenName}`, 'success')
        const updatedScreens = project.screens.map((s) =>
          s.id === screen.id ? { ...s, html: newHtml } : s
        )
        onProjectUpdate({ ...project, screens: updatedScreens, updatedAt: new Date().toLocaleDateString() })
      } else {
        // For AI-powered actions — blur during processing
        setScreensGenerating([screen.id], true)
        const actionPrompts: Record<string, string> = {
          'make-prominent': `Make this UI element more visually prominent. Increase size slightly, bolder colors, more contrast. Keep content.`,
          'improve-hierarchy': `Improve visual hierarchy: adjust font weight, size, color contrast, spacing. Keep content.`,
        }
        const prompt = actionPrompts[action]
        if (!prompt) { updateLog(logId, t('editor.log.unknownAction', { action }), 'error'); return }

        const { editDesignElement } = await import('../lib/gemini')
        const doc = new DOMParser().parseFromString(screen.html, 'text/html')
        const el = doc.querySelector(zone.cssPath)
        const outerHtml = (el?.outerHTML || `<${zone.tagName}></${zone.tagName}>`).replace(/data:[^"')\s]{200,}/g, '[img]')

        const newHtml = await editDesignElement(screen.html, zone.cssPath, outerHtml, prompt)
        updateLog(logId, `Applied "${action}" to <${zone.tagName}> in ${screenName}`, 'success')
        const updatedScreens = project.screens.map((s) =>
          s.id === screen.id ? { ...s, html: newHtml, generating: false } : s
        )
        onProjectUpdate({ ...project, screens: updatedScreens, updatedAt: new Date().toLocaleDateString() })
      }

      setHeatmapData((prev) => {
        const next = new Map(prev)
        next.delete(screen.id)
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateLog(logId, t('editor.log.actionFailed', { action, error: message }), 'error')
      setScreensGenerating([screen.id], false) // remove blur on error
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBatchEditSelected = async (prompt: string) => {
    if (isGenerating || selectedScreens.size === 0) return

    const targets = project.screens.filter(s => selectedScreens.has(s.name))
    if (targets.length === 0) return

    setIsGenerating(true)
    setAgentLogOpen(true)
    setScreensGenerating(targets.map(s => s.id), true) // blur selected screens
    const logId = addLog(`Editing ${targets.length} selected screens: "${prompt}"`, 'generating')

    try {
      const editPromises = targets.map(async (s) => {
        const newHtml = await editDesign(s.html, prompt)
        return { ...s, html: newHtml, generating: false }
      })
      const updated = await Promise.all(editPromises)

      const newScreens = project.screens.map(s => {
        const u = updated.find(us => us.id === s.id)
        return u || s
      })

      updateLog(logId, `Updated ${updated.length} screens`, 'success')
      onProjectUpdate({ ...project, screens: newScreens, updatedAt: new Date().toLocaleDateString() })
    } catch (err: any) {
      updateLog(logId, `Batch edit failed: ${err.message}`, 'error')
      setScreensGenerating(targets.map(s => s.id), false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePromptSubmit = async (prompt: string) => {
    if (editMode && selectedElement && selectedScreen) {
      handleElementEdit(prompt)
    } else if (selectedScreens.size >= 2) {
      // Multi-selected screens → batch edit all selected
      handleBatchEditSelected(prompt)
    } else if (selectedScreen && project.screens.some((s) => s.name === selectedScreen)) {
      handleEditScreen(prompt)
    } else {
      // Inject color scheme hint
      let enhancedPrompt = prompt
      if (colorScheme === 'light' && !/light|bright|white/i.test(prompt)) {
        enhancedPrompt += '. Use a LIGHT theme with bright, white/cream backgrounds. NO dark backgrounds.'
      } else if (colorScheme === 'dark' && !/dark|black|night/i.test(prompt)) {
        enhancedPrompt += '. Use a DARK theme with dark/black backgrounds and light text.'
      }

      // Auto-detect multi-screen prompt or apply PRD generation
      let multiMatch = enhancedPrompt.match(/screens?\s*:\s*(.+)/i)

      // If no screens: syntax, auto-generate PRD-style screen names
      if (!multiMatch && project.screens.length === 0) {
        try {
          const prd = await generatePrdPrompt(enhancedPrompt, deviceType)
          if (prd.screenNames.length >= 2) {
            addLog(`Auto-detected ${prd.screenNames.length} screens: ${prd.screenNames.join(', ')}`, 'info')
            handleGenerateMultiScreen(enhancedPrompt, prd.screenNames)
            return
          }
        } catch { /* fallback to single screen */ }
      }

      if (multiMatch) {
        const screenNames = multiMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean)
        const appDescription = enhancedPrompt.replace(multiMatch[0], '').trim()
        if (screenNames.length > 1 && appDescription) {
          handleGenerateMultiScreen(appDescription, screenNames)
          return
        }
      }
      handleGenerateScreen(enhancedPrompt)
    }
  }

  const handleRegenerateScreen = async () => {
    if (!selectedScreen || isGenerating) return
    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return

    setIsGenerating(true)
    setAgentLogOpen(true)
    setScreensGenerating([screen.id], true) // blur
    const logId = addLog(t('editor.log.regenerating', { name: screen.name }), 'generating')

    try {
      const results = await generateDesign(screen.name, deviceType)
      if (results[0]) {
        updateLog(logId, t('editor.log.regenerated', { name: screen.name }), 'success')
        const updatedScreens = project.screens.map((s) =>
          s.id === screen.id ? { ...s, html: results[0].html, generating: false } : s
        )
        onProjectUpdate({ ...project, screens: updatedScreens, updatedAt: new Date().toLocaleDateString() })
      }
    } catch (err) {
      updateLog(logId, t('editor.log.regenerateFailed', { error: err instanceof Error ? err.message : 'Unknown error' }), 'error')
      setScreensGenerating([screen.id], false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDuplicateScreen = () => {
    if (!selectedScreen) return
    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return
    const dup: Screen = { id: crypto.randomUUID(), name: `${screen.name}${t('editor.log.copySuffix')}`, html: screen.html }
    onProjectUpdate({ ...project, screens: [...project.screens, dup], updatedAt: new Date().toLocaleDateString() })
    addLog(t('editor.log.duplicated', { name: screen.name }), 'success')
  }

  const handleDeleteScreen = () => {
    if (!selectedScreen) return
    const updated = project.screens.filter((s) => s.name !== selectedScreen)
    onProjectUpdate({ ...project, screens: updated, updatedAt: new Date().toLocaleDateString() })
    addLog(t('editor.log.deleted', { name: selectedScreen }), 'info')
    setSelectedScreen(null)
  }

  const handleGenerateVariation = async () => {
    if (!selectedScreen || isGenerating) return
    const screen = project.screens.find((s) => s.name === selectedScreen)
    if (!screen) return

    setIsGenerating(true)
    setAgentLogOpen(true)
    const logId = addLog(`Generating layout variation for "${screen.name}"...`, 'generating')

    try {
      const dsTokens = project.designSystem ? formatDSForVariation(project.designSystem) : ''
      const results = await generateDesign(
        `Create a completely different layout variation of the "${screen.name}" screen. ` +
        `The content and functionality must be the same, but use a DIFFERENT layout structure: ` +
        `different grid arrangement, different card sizes, different component ordering, different navigation placement. ` +
        `Keep the same design system (colors, fonts, spacing).${dsTokens}`,
        deviceType,
        activeGuide,
        undefined,
        screen.html,
        project.designSystem,
      )

      if (results[0]) {
        const variation: Screen = {
          id: crypto.randomUUID(),
          name: `${screen.name} (variation)`,
          html: results[0].html,
        }

        // Insert variation right after the original screen
        const idx = project.screens.findIndex((s) => s.id === screen.id)
        const newScreens = [...project.screens]
        newScreens.splice(idx + 1, 0, variation)

        onProjectUpdate({ ...project, screens: newScreens, updatedAt: new Date().toLocaleDateString() })
        updateLog(logId, `Variation created: "${variation.name}"`, 'success')
        setSelectedScreen(variation.name)
      }
    } catch (err) {
      updateLog(logId, `Variation failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  function formatDSForVariation(ds: any): string {
    if (!ds?.colors?.primary?.base) return ''
    return ` Use exactly these colors: primary ${ds.colors.primary.base}, secondary ${ds.colors.secondary.base}, ` +
      `font: ${ds.typography?.headline?.family || 'auto'}.`
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
          addLog(t('editor.log.copiedCode', { name: screen.name }), 'success')
        }
        break
      }
      case 'copy-png':
        addLog(t('editor.log.copyPngSoon'), 'info')
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
        addLog(t('editor.log.switchedMobile'), 'info')
        break
      case 'device-tablet':
        window.electronAPI?.setLiveWindowSize(800, 1060)
        addLog(t('editor.log.switchedTablet'), 'info')
        break
      case 'device-desktop':
        window.electronAPI?.setLiveWindowSize(1320, 1060)
        addLog(t('editor.log.switchedDesktop'), 'info')
        break
      case 'always-on-top':
        window.electronAPI?.setLiveWindowAlwaysOnTop(true)
        addLog(t('editor.log.alwaysOnTop'), 'info')
        break
      case 'variations':
        handleGenerateVariation()
        break
      case 'desktop-web':
        addLog(t('common.comingSoon', { action: 'Desktop web version' }), 'info')
        break
      case 'heatmap':
        handleToggleHeatmap()
        break
      case 'edit':
        setEditMode(!editMode)
        setSelectedElement(null)
        addLog(editMode ? t('editor.log.exitedEditMode') : t('editor.log.enteredEditMode'), 'info')
        break
      case 'annotate':
        addLog(t('common.comingSoon', { action: 'Annotate' }), 'info')
        break
      case 'design-system':
        addLog(t('common.comingSoon', { action: 'Design system editor' }), 'info')
        break
      case 'download':
        addLog(t('common.comingSoon', { action: 'Download' }), 'info')
        break
      case 'copy':
      case 'copy-as':
      case 'cut':
      case 'focus':
      case 'favourite':
      case 'open-editor':
      case 'devtools':
        addLog(t('common.comingSoon', { action }), 'info')
        break
      default:
        break
    }
  }

  const spaceHeld = useRef(false)
  const [spaceDown, setSpaceDown] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceHeld.current = true
        setSpaceDown(true)
      }
      if (e.code === 'KeyE' && selectedScreen && !e.repeat) {
        setEditMode((v) => !v)
        setSelectedElement(null)
      }
      if (e.code === 'KeyH' && selectedScreen && !e.repeat) {
        handleToggleHeatmap()
      }
      if (e.code === 'Escape') {
        if (heatmapMode) { setHeatmapMode(false); setHeatmapActionMenu(null) }
        else if (editMode) { setEditMode(false); setSelectedElement(null) }
        else if (selectedScreen) { setSelectedScreen(null) }
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
  }, [selectedScreen, editMode, heatmapMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isMiddle = e.button === 1
    const isLeftWithMod = e.button === 0 && (e.altKey || spaceHeld.current)
    const isLeftOnEmptyCanvas = e.button === 0 && !(e.target as HTMLElement).closest('[data-screen-card]')

    if (isLeftOnEmptyCanvas && !isLeftWithMod) {
      setSelectedScreen(null)
      setEditMode(false)
      setSelectedElement(null)
      setHeatmapMode(false)
      setHeatmapActionMenu(null)
    }

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

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    sidebarResizing.current = true
    const startX = e.clientX
    const startWidth = leftSidebarWidth

    const onMove = (ev: MouseEvent) => {
      if (!sidebarResizing.current) return
      const newWidth = Math.max(40, Math.min(280, startWidth + (ev.clientX - startX)))
      setLeftSidebarWidth(newWidth)
    }
    const onUp = () => {
      sidebarResizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftSidebarWidth])

  useEffect(() => {
    const cleanup = window.electronAPI?.onLiveEditRequest(async (prompt: string) => {
      if (!devServerUrl || !project.id) return
      addLog(t('editor.log.liveEditRequest', { prompt }), 'generating')

      const targetFile = 'src/App.tsx'
      let beforeContent = ''

      try {
        const currentContent = await window.electronAPI?.project.readFile(project.id, targetFile)
        if (!currentContent) {
          window.electronAPI?.sendLiveEditResult({ success: false, message: 'Could not read file' })
          return
        }
        beforeContent = currentContent

        const fileList = project.screens.map(s => `src/pages/${s.name.replace(/\s+/g, '')}.tsx`)
        fileList.push('src/App.tsx', 'src/main.tsx', 'src/index.css')

        const updated = await editFrontendFile(targetFile, currentContent, prompt, {
          files: fileList,
          screens: project.screens.map(s => s.name),
        })

        await window.electronAPI?.project.writeFile(project.id, targetFile, updated)

        // §11.1 Designer / Developer mode feedback — show in popup window
        if (feedbackMode === 'designer') {
          const friendlyMsg = await paraphraseLiveEditForDesigner(
            prompt, targetFile, beforeContent.slice(0, 500), updated.slice(0, 500), locale,
          )
          addLog(friendlyMsg, 'success')
          window.electronAPI?.liveEdit.updateFeedback(friendlyMsg, 'success')
          window.electronAPI?.sendLiveEditResult({ success: true, message: friendlyMsg })
        } else {
          const md = buildLiveEditDeveloperMarkdown(prompt, targetFile, beforeContent, updated, locale)
          addLog(t('editor.log.liveEditApplied'), 'success')
          window.electronAPI?.liveEdit.updateFeedback('Changes applied', 'success', md)
          window.electronAPI?.sendLiveEditResult({ success: true, message: 'Changes applied', devMarkdown: md })
        }
      } catch (err: any) {
        if (feedbackMode === 'designer') {
          const friendlyErr = await paraphraseLiveEditFailure(prompt, err.message, locale).catch(() => err.message)
          addLog(friendlyErr, 'error')
          window.electronAPI?.liveEdit.updateFeedback(friendlyErr, 'error')
          window.electronAPI?.sendLiveEditResult({ success: false, message: friendlyErr })
        } else {
          addLog(t('editor.log.liveEditFailed', { error: err.message }), 'error')
          window.electronAPI?.liveEdit.updateFeedback(err.message, 'error')
          window.electronAPI?.sendLiveEditResult({ success: false, message: err.message })
        }
      }
    })
    return () => cleanup?.()
  }, [devServerUrl, project.id, project.screens, feedbackMode, locale]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = async () => {
    if (isRunning) {
      window.electronAPI?.closeLiveWindow()
      window.electronAPI?.liveEdit.close()
      window.electronAPI?.feedback.close()
      await window.electronAPI?.project.stopDev()
      setIsRunning(false)
      setDevServerUrl(null)
      return
    }

    if (project.screens.length >= 2) {
      setBuildingFrontend(true)
      setAgentLogOpen(true)

      try {
        const cache = buildCacheRef.current
        // Filter out generating/empty screens — only include completed ones with real HTML
        const allScreensData = project.screens
          .filter(s => !s.generating && s.html && s.html.length > 100)
          .map(s => ({ name: s.name, html: s.html }))

        if (allScreensData.length === 0) {
          addLog('No completed screens to build. Wait for generation to finish.', 'error')
          setBuildingFrontend(false)
          return
        }

        // Diff: find new/changed screens vs cache
        const newOrChanged: { name: string; html: string }[] = []
        const unchanged: string[] = []
        for (const s of project.screens) {
          const h = hashString(s.html)
          const cached = cache.get(s.id)
          if (cached && cached.htmlHash === h) {
            unchanged.push(s.name)
          } else {
            newOrChanged.push({ name: s.name, html: s.html })
          }
        }

        const isIncremental = unchanged.length > 0 && newOrChanged.length > 0
        let files: Record<string, string>

        if (isIncremental) {
          // ─── Incremental build: only generate new/changed screens ───
          const logId = addLog(
            t('editor.log.incrementalBuild', { info: `${newOrChanged.length} new/changed, ${unchanged.length} cached` }),
            'generating',
          )
          addLog(t('editor.log.cached', { name: unchanged.join(', ') }), 'info')
          addLog(t('editor.log.buildingScreen', { name: newOrChanged.map(s => s.name).join(', ') }), 'info')

          // Collect existing generated files from cache
          const existingFiles: Record<string, string> = {}
          for (const s of project.screens) {
            const cached = cache.get(s.id)
            if (cached) {
              for (const [path, content] of Object.entries(cached.files)) {
                existingFiles[path] = content
              }
            }
          }

          files = await generateIncrementalFrontend(
            newOrChanged,
            allScreensData,
            existingFiles,
            deviceType,
          )
          updateLog(logId, t('editor.log.incrementalFiles', { count: Object.keys(files).length }), 'generating')

          // Merge: keep cached files, overwrite with new
          const mergedFiles = { ...existingFiles, ...files }
          files = mergedFiles
        } else {
          // ─── Full build: all screens are new ───
          const logId = addLog(t('editor.log.generatingFrontend'), 'generating')
          files = await generateFrontendApp(allScreensData, deviceType, project.prompt, project.designSystem || undefined)
          updateLog(logId, t('editor.log.generatedFiles', { count: Object.keys(files).length }), 'generating')
        }

        await window.electronAPI?.project.scaffold(project.id, files)

        // Update build cache
        for (const s of project.screens) {
          const component = s.name.replace(/[^a-zA-Z0-9]/g, '')
          const screenFiles: Record<string, string> = {}
          for (const [path, content] of Object.entries(files)) {
            if (path.includes(component) || path === 'src/App.tsx' || path === 'src/index.css') {
              screenFiles[path] = content
            }
          }
          cache.set(s.id, { htmlHash: hashString(s.html), files: screenFiles })
        }

        // Skip npm install if dev server is already running (incremental)
        if (!devServerUrl) {
          addLog(t('editor.log.installingDeps'), 'generating')
          const installResult = await window.electronAPI?.project.install(project.id)
          if (!installResult?.success) {
            addLog(t('editor.log.npmFailed', { error: installResult?.error || '' }), 'error')
            setBuildingFrontend(false)
            return
          }

          const MAX_FIX_ATTEMPTS = 2
          let lastError = ''
          let devStarted = false

          for (let attempt = 0; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
            addLog(attempt === 0 ? t('editor.log.startingDevServer') : t('editor.log.retryDevServer', { attempt, max: MAX_FIX_ATTEMPTS }), 'generating')
            const port = 5173 + Math.floor(Math.random() * 100)
            const devResult = await window.electronAPI?.project.startDev(project.id, port)

            if (devResult?.success) {
              const url = devResult.url || `http://localhost:${port}`
              setDevServerUrl(url)
              addLog(t('editor.log.devServerRunning', { url }), 'success')
              await window.electronAPI?.openLiveWindowUrl(url, deviceType)
              devStarted = true
              break
            }

            lastError = devResult?.error || 'Unknown error'
            addLog(t('editor.log.buildError', { error: lastError.slice(0, 200) }), 'error')

            if (attempt < MAX_FIX_ATTEMPTS) {
              addLog(t('editor.log.autoFixing'), 'generating')
              try {
                // Read problematic files from project
                const filesToFix: Record<string, string> = {}
                for (const [path, content] of Object.entries(files)) {
                  if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.css') || path === 'index.html') {
                    filesToFix[path] = content
                  }
                }

                const fixedFiles = await fixBuildErrors(lastError, filesToFix)
                const fixedCount = Object.keys(fixedFiles).length
                addLog(t('editor.log.aiFixed', { count: fixedCount, files: Object.keys(fixedFiles).join(', ') }), 'info')

                // Write fixed files
                for (const [path, content] of Object.entries(fixedFiles)) {
                  await window.electronAPI?.project.writeFile(project.id, path, content)
                  files[path] = content
                }

                // Stop previous failed dev server before retry
                await window.electronAPI?.project.stopDev()
              } catch (fixErr: any) {
                addLog(t('editor.log.autoFixFailed', { error: fixErr.message }), 'error')
              }
            }
          }

          if (!devStarted) {
            addLog(t('editor.log.devServerFailed', { count: MAX_FIX_ATTEMPTS, error: lastError }), 'error')
            setBuildingFrontend(false)
            return
          }
        } else {
          // Dev server already running — just write files, HMR picks up changes
          addLog(t('editor.log.filesUpdated'), 'success')
        }
        setIsRunning(true)
        // Open Live Edit popup alongside Live App
        window.electronAPI?.liveEdit.open()
      } catch (err: any) {
        addLog(t('editor.log.frontendFailed', { error: err.message }), 'error')
      } finally {
        setBuildingFrontend(false)
      }
    } else {
      const screen = selectedScreen
        ? project.screens.find((s) => s.name === selectedScreen)
        : project.screens[0]
      window.electronAPI?.openLiveWindow(screen?.html, deviceType)
      setIsRunning(true)
      window.electronAPI?.liveEdit.open()
    }
  }

  const screenWidth = deviceType === 'app' ? 390 : deviceType === 'tablet' ? 1024 : 1280
  const screenMinHeight = deviceType === 'app' ? 844 : deviceType === 'tablet' ? 1366 : 900
  const selectedScreenObj = selectedScreen ? project.screens.find((s) => s.name === selectedScreen) : null

  const handleScreenHeightMeasured = useCallback((_screenId: string, measuredHeight: number) => {
    if (autoZoomDone.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasHeight = canvas.clientHeight
    const cardScale = 0.5
    const padding = 80
    const displayHeight = measuredHeight * cardScale + padding
    if (displayHeight > canvasHeight) {
      const fitZoom = Math.floor((canvasHeight / displayHeight) * 100)
      const clampedZoom = Math.max(10, Math.min(100, fitZoom))
      setZoom(clampedZoom)
      autoZoomDone.current = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-3 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shrink-0 draggable">
        <div className="flex items-center gap-2 no-drag">
          {/* Hamburger */}
          <div className="relative">
            <button
              data-testid="hamburger-menu"
              onClick={() => setShowHamburger(!showHamburger)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            {showHamburger && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                <MenuItem icon="←" label={t('editor.menu.goToProjects')} onClick={() => { setShowHamburger(false); onBack() }} />
                <MenuItem icon="📦" label="Export as ZIP" onClick={async () => {
                  setShowHamburger(false)
                  const result = await window.electronAPI?.project.exportZip(
                    project.id,
                    project.screens.map(s => ({ name: s.name, html: s.html }))
                  )
                  if (result?.success) {
                    addLog(`Exported ZIP to ${result.path}`, 'success')
                  } else {
                    addLog(`ZIP export: ${result?.error || 'cancelled'}`, 'info')
                  }
                }} />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MenuItem icon="🎨" label={t('editor.menu.appearance')} onClick={() => {
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
                <MenuItem icon="⚙" label={t('common.settings')} onClick={() => { setShowHamburger(false); onOpenSettings?.() }} />
                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <MenuItem icon="⌘" label={t('editor.menu.commandMenu')} shortcut="⌘K" onClick={() => setShowHamburger(false)} />
              </div>
            )}
          </div>

          {editingProjectName ? (
            <input
              autoFocus
              value={projectNameValue}
              onChange={(e) => setProjectNameValue(e.target.value)}
              onBlur={() => {
                if (projectNameValue.trim() && projectNameValue.trim() !== project.name) {
                  onProjectUpdate({ ...project, name: projectNameValue.trim() })
                }
                setEditingProjectName(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') { setProjectNameValue(project.name); setEditingProjectName(false) }
              }}
              className="text-sm font-medium bg-transparent border-b border-blue-400 outline-none w-48 no-drag"
            />
          ) : (
            <button
              onClick={() => { setEditingProjectName(true); setProjectNameValue(project.name) }}
              className="text-sm font-medium hover:text-blue-500 transition-colors no-drag"
              title="Click to rename project"
            >
              {project.name}
            </button>
          )}

          {isGenerating && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <LoadingSpinner />
              {t('editor.generating')}
            </span>
          )}
          {editMode && !isGenerating && (
            <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <PenSmallIcon />
              {t('editor.editMode')}
            </span>
          )}
          {heatmapMode && !isGenerating && (
            <span className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
              <HeatmapSmallIcon />
              {t('editor.heatmap')}
            </span>
          )}
          {heatmapLoading && (
            <span className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
              <LoadingSpinner />
              {t('editor.analyzing')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 no-drag">
          {/* Run/Stop button */}
          <button
            onClick={handleRun}
            disabled={buildingFrontend}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg ${
              buildingFrontend
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 cursor-wait'
                : isRunning
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200'
            }`}
          >
            {buildingFrontend ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" /><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                Building...
              </span>
            ) : isRunning ? t('editor.stop') : t('editor.run')}
          </button>

          {/* §11.1 Designer / Developer mode toggle */}
          {isRunning && (
            <button
              onClick={toggleFeedbackMode}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                feedbackMode === 'developer'
                  ? 'border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-neutral-200 dark:border-neutral-600 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
              title={feedbackMode === 'designer' ? 'Switch to Developer mode' : 'Switch to Designer mode'}
            >
              {feedbackMode === 'designer' ? '🎨 Designer' : '💻 Developer'}
            </button>
          )}

          <button
            onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title={locale === 'en' ? '한국어로 전환' : 'Switch to English'}
          >
            {locale === 'en' ? 'KO' : 'EN'}
          </button>

          <AppearanceToggle />

          <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title={t('common.settings')}>
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-select toolbar — shown when multiple screens are selected */}
        {selectedScreens.size >= 2 && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1 z-40">
            <div className="flex items-center gap-2 bg-violet-600 dark:bg-violet-700 text-white px-4 py-2 rounded-xl shadow-lg text-sm">
              <span className="font-semibold">{selectedScreens.size} screens selected</span>
              <div className="w-px h-4 bg-violet-400" />
              <button
                onClick={() => {
                  // Batch delete
                  const updated = project.screens.filter(s => !selectedScreens.has(s.name))
                  onProjectUpdate({ ...project, screens: updated, updatedAt: new Date().toLocaleDateString() })
                  addLog(`Deleted ${selectedScreens.size} screens`, 'info')
                  clearMultiSelection()
                  setSelectedScreen(null)
                }}
                className="px-2 py-0.5 rounded-lg hover:bg-violet-500 text-xs font-medium"
              >
                🗑 Delete All
              </button>
              <button
                onClick={async () => {
                  // Batch edit — open prompt
                  const prompt = window.prompt('Edit all selected screens:')
                  if (!prompt) return
                  setIsGenerating(true)
                  addLog(`Batch editing ${selectedScreens.size} screens: "${prompt}"`, 'generating')
                  try {
                    const targets = project.screens.filter(s => selectedScreens.has(s.name))
                    const promises = targets.map(s => editDesign(s.html, prompt).then(html => ({ ...s, html })))
                    const updated = await Promise.all(promises)
                    const newScreens = project.screens.map(s => {
                      const u = updated.find(us => us.id === s.id)
                      return u || s
                    })
                    onProjectUpdate({ ...project, screens: newScreens, updatedAt: new Date().toLocaleDateString() })
                    addLog(`Batch updated ${updated.length} screens`, 'success')
                  } catch (err: any) {
                    addLog(`Batch edit failed: ${err.message}`, 'error')
                  } finally {
                    setIsGenerating(false)
                  }
                }}
                className="px-2 py-0.5 rounded-lg hover:bg-violet-500 text-xs font-medium"
              >
                ✏️ Edit All
              </button>
              <button
                onClick={clearMultiSelection}
                className="px-2 py-0.5 rounded-lg hover:bg-violet-500 text-xs"
              >
                ✕ Clear
              </button>
            </div>
          </div>
        )}

        {/* Screen context toolbar - shown when single screen is selected */}
        {selectedScreen && selectedScreens.size < 2 && (
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
        <div
          className="bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col py-2 gap-1 shrink-0 relative"
          style={{ width: leftSidebarWidth }}
        >
          <div className={`flex flex-col gap-1 ${leftSidebarWidth > 80 ? 'items-start px-2' : 'items-center'}`}>
            <ToolButton icon={<CursorIcon />} title={t('editor.tool.cursor')} active={activeTool === 'cursor'} label={leftSidebarWidth > 80 ? t('editor.tool.cursor') : undefined} onClick={() => setActiveTool('cursor')} />
            <ToolButton icon={<SelectIcon />} title={t('editor.tool.select')} active={activeTool === 'select'} label={leftSidebarWidth > 80 ? t('editor.tool.select') : undefined} onClick={() => {
              if (activeTool === 'select') {
                setActiveTool('cursor')
                clearMultiSelection()
              } else {
                setActiveTool('select')
                addLog('Multi-select mode: click screens to select/deselect. Shift+click also works in cursor mode.', 'info')
              }
            }} />
            <ToolButton icon={<ElementSelectIcon />} title="Element Select" active={activeTool === 'element'} label={leftSidebarWidth > 80 ? 'Element' : undefined} onClick={() => {
              if (activeTool === 'element') {
                // Exit element/edit mode
                setActiveTool('cursor')
                setEditMode(false)
                setSelectedElement(null)
              } else {
                setActiveTool('element')
                // Enter edit mode on selected screen
                if (selectedScreen) {
                  setEditMode(true)
                  addLog('Element select mode: click elements inside the screen to select and edit them.', 'info')
                } else {
                  addLog('Select a screen first, then use Element tool to pick elements inside it.', 'info')
                }
              }
            }} />
            <div className="h-px w-6 bg-neutral-200 dark:bg-neutral-700 my-1 self-center" />
            {/* 마이크 아이콘 제거됨 */}
            <ToolButton icon={<ImageIcon />} title={t('editor.tool.image')} active={activeTool === 'image'} label={leftSidebarWidth > 80 ? t('editor.tool.image') : undefined} onClick={() => {
              setActiveTool('image')
              // Open file picker for image reference
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = async () => {
                  const base64 = (reader.result as string).split(',')[1]
                  addLog(`Image loaded: ${file.name} — analyzing...`, 'generating')
                  try {
                    const ds = await analyzeDesignFromImage(base64, file.type)
                    addLog(`Design extracted from image: "${ds.name}"`, 'success')
                    onProjectUpdate({ ...project, designSystem: ds, updatedAt: new Date().toLocaleDateString() })
                  } catch (err: any) {
                    addLog(`Image analysis failed: ${err.message}`, 'error')
                  }
                }
                reader.readAsDataURL(file)
                setActiveTool('cursor')
              }
              input.click()
            }} />
          </div>
          {/* Resize handle */}
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500/50 transition-colors z-10"
            onMouseDown={handleSidebarResizeStart}
          />
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          data-editor-canvas
          className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : spaceDown ? 'cursor-grab' : 'cursor-default'}`}
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
                      minHeight={screenMinHeight}
                      isSelected={selectedScreen === screen.name}
                      isMultiSelected={selectedScreens.has(screen.name)}
                      editMode={editMode}
                      heatmapMode={heatmapMode}
                      heatmapZones={heatmapData.get(screen.id)}
                      deviceType={deviceType}
                      onClick={() => {
                        if (!editMode && !heatmapMode) handleScreenClick(screen.name)
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setSelectedScreen(screen.name)
                        setContextMenu({ x: e.clientX, y: e.clientY })
                      }}
                      onElementSelect={(info) => {
                        setSelectedElement(info)
                        addLog(t('editor.log.selectedElement', { tag: info.tagName, text: info.textPreview.slice(0, 40) }), 'info')
                      }}
                      onHeatmapZoneClick={(zone, x, y) => {
                        setHeatmapActionMenu({ zone, screenName: screen.name, x, y })
                      }}
                      onHeightMeasured={handleScreenHeightMeasured}
                      onResize={(screenId, newW, newH) => {
                        const updatedScreens = project.screens.map(s =>
                          s.id === screenId ? { ...s, customWidth: newW, customHeight: newH } : s
                        )
                        onProjectUpdate({ ...project, screens: updatedScreens, updatedAt: new Date().toLocaleDateString() })
                      }}
                    />
                  ))
                ) : (
                  /* Empty state placeholder */
                  <div className="flex flex-col items-center justify-center" style={{ width: screenWidth * 0.5, height: screenMinHeight * 0.5 }}>
                    <div className="rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center w-full h-full bg-neutral-100 dark:bg-neutral-800">
                      {isGenerating ? (
                        <div className="flex flex-col items-center gap-3">
                          <LoadingSpinner size="lg" />
                          <span className="text-sm text-neutral-500">{t('editor.generatingDesign')}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">
                          {t('editor.enterPrompt')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 z-20">
            <button
              data-testid="zoom-indicator"
              onClick={() => { setZoom(100); autoZoomDone.current = false }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/90 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 shadow-sm backdrop-blur-sm"
            >
              {Math.round(zoom)}%
            </button>
          </div>
        </div>

        {/* Right floating panel */}
        <RightPanel
          designSystem={designSystem}
          screenNames={project.screens.map(s => s.name)}
          selectedScreen={selectedScreen}
          onSelectScreen={(name) => setSelectedScreen(selectedScreen === name ? null : name)}
          onDesignSystemUpdate={async (ds) => {
            // Update DS + set all screens to generating (blur animation)
            const blurredScreens = project.screens.map(s => ({ ...s, generating: true }))
            onProjectUpdate({
              ...project,
              screens: blurredScreens,
              designSystem: ds,
              updatedAt: new Date().toLocaleDateString(),
            })

            // Ask LLM to re-apply the new design system to all screens
            if (project.screens.length > 0 && !isGenerating) {
              setIsGenerating(true)
              setAgentLogOpen(true)
              const logId = addLog(`Applying design system "${ds.name}" to ${project.screens.length} screens via AI...`, 'generating')

              try {
                const dsDescription = `Apply this design system:\n` +
                  `Primary: ${ds.colors.primary.base}, Secondary: ${ds.colors.secondary.base}, ` +
                  `Tertiary: ${ds.colors.tertiary.base}, Neutral: ${ds.colors.neutral.base}\n` +
                  `Headline font: ${ds.typography.headline.family}, Body font: ${ds.typography.body.family}\n` +
                  `Color scheme: ${ds.colorScheme || 'auto'}`

                const editPromises = project.screens
                  .filter(s => s.html && s.html.length > 100)
                  .map(async (s) => {
                    const newHtml = await editDesign(s.html,
                      `Completely re-style this screen with the following design system. ` +
                      `Change ALL colors, fonts, and component styles to match. ` +
                      `Keep the exact same layout, content, and functionality. ` +
                      `${dsDescription}`
                    )
                    return { ...s, html: newHtml, generating: false }
                  })

                const updatedScreens = await Promise.all(editPromises)
                updateLog(logId, `Design system "${ds.name}" applied to ${updatedScreens.length} screens`, 'success')

                onProjectUpdate({
                  ...project,
                  screens: updatedScreens,
                  designSystem: ds,
                  updatedAt: new Date().toLocaleDateString(),
                })
              } catch (err: any) {
                updateLog(logId, `Failed to apply DS: ${err.message}`, 'error')
                // Remove blur on failure
                onProjectUpdate({
                  ...project,
                  screens: project.screens.map(s => ({ ...s, generating: false })),
                  designSystem: ds,
                  updatedAt: new Date().toLocaleDateString(),
                })
              } finally {
                setIsGenerating(false)
              }
            }
          }}
          onSaveDesignSystem={() => {
            if (!designSystem || designSystem.name === 'Generating...') return
            designGuideDB.saveFromGeneration(
              designSystem.name,
              project.prompt || project.name,
              designSystem.guide || { overview: '', colorRules: '', typographyRules: '', elevationRules: '', componentRules: '', dosAndDonts: '' },
              designSystem,
            )
            addLog(t('editor.log.dsSaved', { name: designSystem.name }), 'success')
          }}
          onLoadDesignSystem={(id) => {
            const entry = designGuideDB.getById(id)
            if (!entry?.designSystem) return
            const oldDs = project.designSystem
            const newDs = entry.designSystem

            let updatedScreens = project.screens
            if (oldDs) {
              const replacements: [string, string][] = []
              for (const role of ['primary', 'secondary', 'tertiary', 'neutral'] as const) {
                const oldRole = oldDs.colors[role]
                const newRole = newDs.colors[role]
                if (oldRole.base !== newRole.base) replacements.push([oldRole.base, newRole.base])
                oldRole.tones.forEach((oldT, i) => {
                  if (oldT !== newRole.tones[i]) replacements.push([oldT, newRole.tones[i]])
                })
              }
              for (const level of ['headline', 'body', 'label'] as const) {
                const oldFont = oldDs.typography[level]?.family
                const newFont = newDs.typography[level]?.family
                if (oldFont && newFont && oldFont !== newFont) replacements.push([oldFont, newFont])
              }
              if (replacements.length > 0) {
                updatedScreens = project.screens.map((s) => {
                  let html = s.html
                  for (const [oldVal, newVal] of replacements) html = html.split(oldVal).join(newVal)
                  return html !== s.html ? { ...s, html } : s
                })
              }
            }

            onProjectUpdate({ ...project, screens: updatedScreens, designSystem: newDs, updatedAt: new Date().toLocaleDateString() })
            addLog(t('editor.log.dsLoaded', { name: newDs.name, count: updatedScreens.filter((s, i) => s !== project.screens[i]).length }), 'success')
          }}
          onDeleteDesignSystem={(id) => {
            designGuideDB.delete(id)
            addLog(`Design system deleted`, 'info')
          }}
          onSetRecommended={(id) => {
            const entry = designGuideDB.getById(id)
            if (entry) {
              entry.source = 'curated'
              designGuideDB.upsert(entry)
              addLog(`"${entry.name}" set as recommended`, 'success')
            }
          }}
          getDesignSystemById={(id) => {
            const entry = designGuideDB.getById(id)
            return entry?.designSystem
          }}
          savedDesignSystems={designGuideDB.getAllWithDesignSystem().map(e => ({ id: e.id, name: e.name, savedAt: e.createdAt }))}
          onStealDesign={(query) => {
            if (!window.electronAPI?.pinterest) {
              addLog(t('editor.log.pinterestNotAvailable'), 'error')
              return
            }
            addLog(t('editor.log.openingPinterest', { query }), 'info')
            window.electronAPI.pinterest.open(query)
          }}
          onStealUrl={async (imageUrl) => {
            if (!window.electronAPI?.pinterest) {
              addLog(t('editor.log.pinterestNotAvailable'), 'error')
              return
            }

            const cleanup = window.electronAPI.pinterest.onImageCaptured(async (base64, mimeType) => {
              cleanup()
              if (!base64 || !mimeType) {
                addLog(t('editor.log.processingImageFailed'), 'error')
                return
              }
              addLog(t('editor.log.analyzingImage'), 'info')
              try {
                const newDs = await analyzeDesignFromImage(base64, mimeType)
                const oldDs = project.designSystem
                let updatedScreens = project.screens

                if (oldDs && oldDs.name !== 'Generating...') {
                  const replacements: [string, string][] = []
                  for (const role of ['primary', 'secondary', 'tertiary', 'neutral'] as const) {
                    const oldRole = oldDs.colors[role]
                    const newRole = newDs.colors[role]
                    if (oldRole.base !== newRole.base) replacements.push([oldRole.base, newRole.base])
                    oldRole.tones.forEach((oldT: string, i: number) => {
                      if (oldT !== newRole.tones[i]) replacements.push([oldT, newRole.tones[i]])
                    })
                  }
                  for (const level of ['headline', 'body', 'label'] as const) {
                    const oldFont = oldDs.typography[level]?.family
                    const newFont = newDs.typography[level]?.family
                    if (oldFont && newFont && oldFont !== newFont) replacements.push([oldFont, newFont])
                  }
                  if (replacements.length > 0) {
                    updatedScreens = project.screens.map((s) => {
                      let html = s.html
                      for (const [oldVal, newVal] of replacements) {
                        html = html.split(oldVal).join(newVal)
                      }
                      return html !== s.html ? { ...s, html } : s
                    })
                  }
                }

                // Save stolen DS to recommended list
                // Save to localStorage (designGuideDB)
                designGuideDB.saveFromGeneration(
                  newDs.name,
                  `Stolen from Pinterest: ${imageUrl.substring(0, 60)}`,
                  newDs.guide || { overview: '', colorRules: '', typographyRules: '', elevationRules: '', componentRules: '', dosAndDonts: '' },
                  newDs
                )

                // Save to Electron DB for persistence
                window.electronAPI?.db.saveGuide({
                  id: `stolen-${Date.now()}`,
                  name: newDs.name,
                  keywords: ['pinterest', 'stolen'],
                  mood: [],
                  domains: [],
                  guide: newDs.guide || {},
                  designSystem: newDs,
                  source: 'ai-generated',
                  createdAt: new Date().toISOString(),
                  userId: 'default',
                })

                addLog(`"${newDs.name}" saved to design systems`, 'success')

                onProjectUpdate({
                  ...project,
                  screens: updatedScreens,
                  designSystem: newDs,
                  updatedAt: new Date().toLocaleDateString(),
                })
                const changed = updatedScreens.filter((s, i) => s !== project.screens[i]).length
                addLog(t('editor.log.stolenDesign', { name: newDs.name, count: changed }), 'success')
              } catch (err: any) {
                addLog(t('editor.log.analyzeDesignFailed', { error: err.message }), 'error')
              }
            })

            addLog(t('editor.log.downloadingImage', { url: imageUrl.substring(0, 60) }), 'info')
            const result = await window.electronAPI.pinterest.stealUrl(imageUrl)
            if (!result.success) {
              cleanup()
              addLog(t('editor.log.downloadFailed', { error: result.error || '' }), 'error')
            }
          }}
          onConnectPinterest={() => {
            if (!window.electronAPI?.pinterest) {
              addLog(t('editor.log.pinterestNotAvailable'), 'error')
              return
            }
            addLog(t('editor.log.openingPinterestLogin'), 'info')
            window.electronAPI.pinterest.connect()
          }}
        />
      </div>

      {/* Bottom: Prompt Bar + Agent Log */}
      <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <PromptBar
            placeholder={
              editMode && selectedElement
                ? t('editor.editElementPlaceholder', { tag: selectedElement.tagName })
                : selectedScreen
                ? t('editor.editScreenPlaceholder', { screen: selectedScreen })
                : t('editor.defaultPlaceholder')
            }
            deviceType={deviceType}
            onDeviceTypeChange={(dt) => { setDeviceType(dt); autoZoomDone.current = false }}
            colorScheme={colorScheme}
            onColorSchemeChange={setColorScheme}
            onSubmit={handlePromptSubmit}
            selectedScreen={selectedScreen || undefined}
            selectedScreens={selectedScreens.size > 0 ? Array.from(selectedScreens) : undefined}
            onRemoveScreen={() => { setSelectedScreen(null); setEditMode(false); setSelectedElement(null); clearMultiSelection() }}
            editMode={editMode}
            selectedElement={selectedElement ? { tagName: selectedElement.tagName, textPreview: selectedElement.textPreview } : undefined}
            onExitEditMode={() => { setEditMode(false); setSelectedElement(null) }}
            onClearElement={() => setSelectedElement(null)}
          />
        </div>

        {/* Agent Log */}
        <AgentLog
          isOpen={agentLogOpen}
          onToggle={() => setAgentLogOpen(!agentLogOpen)}
          entries={logEntries}
        />
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

      {/* Heatmap action menu */}
      {heatmapActionMenu && (
        <HeatmapActionMenu
          x={heatmapActionMenu.x}
          y={heatmapActionMenu.y}
          zone={heatmapActionMenu.zone}
          onAction={(action) => handleHeatmapAction(action, heatmapActionMenu.zone, heatmapActionMenu.screenName)}
          onClose={() => setHeatmapActionMenu(null)}
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

      {/* Developer summary is now shown in feedback popup window — no canvas modal */}
    </div>
  )
}

// Script injected into iframe to enable element selection in edit mode
const EDIT_MODE_SCRIPT = `
<script>
(function() {
  let hoverEl = null;
  const overlay = document.createElement('div');
  overlay.id = '__vs_overlay';
  overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.08);z-index:99999;transition:all 0.1s;display:none;border-radius:4px;';
  document.body.appendChild(overlay);

  const label = document.createElement('div');
  label.id = '__vs_label';
  label.style.cssText = 'position:fixed;z-index:100000;background:#3b82f6;color:#fff;font:500 11px/1.3 system-ui;padding:2px 6px;border-radius:4px;pointer-events:none;display:none;white-space:nowrap;';
  document.body.appendChild(label);

  function cssPath(el) {
    const parts = [];
    while (el && el.nodeType === 1 && el.tagName !== 'HTML') {
      let sel = el.tagName.toLowerCase();
      if (el.id) { sel += '#' + el.id; parts.unshift(sel); break; }
      const sib = el.parentNode ? Array.from(el.parentNode.children) : [];
      const same = sib.filter(s => s.tagName === el.tagName);
      if (same.length > 1) sel += ':nth-of-type(' + (same.indexOf(el) + 1) + ')';
      parts.unshift(sel);
      el = el.parentNode;
    }
    return parts.join(' > ');
  }

  document.addEventListener('mousemove', function(e) {
    const t = e.target;
    if (t === overlay || t === label || t.id === '__vs_overlay' || t.id === '__vs_label') return;
    if (t === hoverEl) return;
    hoverEl = t;
    const r = t.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
    const tag = t.tagName.toLowerCase();
    const cls = t.className && typeof t.className === 'string' ? '.' + t.className.trim().split(/\\s+/).slice(0,2).join('.') : '';
    label.textContent = tag + cls;
    label.style.display = 'block';
    label.style.left = r.left + 'px';
    label.style.top = Math.max(0, r.top - 22) + 'px';
  });

  document.addEventListener('mouseleave', function() {
    overlay.style.display = 'none';
    label.style.display = 'none';
    hoverEl = null;
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const t = e.target;
    if (t.id === '__vs_overlay' || t.id === '__vs_label') return;
    const path = cssPath(t);
    const text = (t.textContent || '').trim().slice(0, 80);
    const outer = t.outerHTML.slice(0, 500);
    window.parent.postMessage({
      type: '__vs_element_selected',
      cssPath: path,
      tagName: t.tagName.toLowerCase(),
      textPreview: text,
      outerHtml: outer,
    }, '*');
  }, true);
})();
</script>`;

// Script injected into iframe to resolve CSS paths to bounding rects
const HEATMAP_PROBE_SCRIPT = `
<script>
(function() {
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === '__vs_heatmap_probe') {
      var results = [];
      var paths = e.data.cssPaths || [];
      for (var i = 0; i < paths.length; i++) {
        try {
          var el = document.querySelector(paths[i]);
          if (el) {
            var r = el.getBoundingClientRect();
            results.push({ cssPath: paths[i], x: r.left, y: r.top, w: r.width, h: r.height });
          } else {
            results.push({ cssPath: paths[i], x: 0, y: 0, w: 0, h: 0 });
          }
        } catch(ex) {
          results.push({ cssPath: paths[i], x: 0, y: 0, w: 0, h: 0 });
        }
      }
      window.parent.postMessage({ type: '__vs_heatmap_rects', rects: results }, '*');
    }
  });
})();
</script>`;

function intensityColor(intensity: number): string {
  if (intensity >= 0.8) return 'rgba(239,68,68,0.45)'
  if (intensity >= 0.6) return 'rgba(249,115,22,0.40)'
  if (intensity >= 0.4) return 'rgba(234,179,8,0.35)'
  if (intensity >= 0.2) return 'rgba(34,197,94,0.30)'
  return 'rgba(59,130,246,0.25)'
}

function intensityBorder(intensity: number): string {
  if (intensity >= 0.8) return 'rgba(239,68,68,0.8)'
  if (intensity >= 0.6) return 'rgba(249,115,22,0.7)'
  if (intensity >= 0.4) return 'rgba(234,179,8,0.6)'
  if (intensity >= 0.2) return 'rgba(34,197,94,0.5)'
  return 'rgba(59,130,246,0.4)'
}

function ScreenCard({
  screen, width, minHeight, isSelected, isMultiSelected, deviceType, editMode, heatmapMode, heatmapZones,
  onClick, onContextMenu, onElementSelect, onHeatmapZoneClick, onHeightMeasured, onResize,
}: {
  screen: Screen; width: number; minHeight: number; deviceType: 'app' | 'web' | 'tablet'
  isSelected?: boolean; isMultiSelected?: boolean; editMode?: boolean; heatmapMode?: boolean; heatmapZones?: HeatmapZone[]
  onClick?: () => void; onContextMenu?: (e: React.MouseEvent) => void
  onElementSelect?: (info: { cssPath: string; tagName: string; textPreview: string; outerHtml: string }) => void
  onHeatmapZoneClick?: (zone: HeatmapZone, x: number, y: number) => void
  onHeightMeasured?: (screenId: string, height: number) => void
  onResize?: (screenId: string, newWidth: number, newHeight: number) => void
}) {
  const isGenerating = screen.generating === true
  const [revealed, setRevealed] = useState(!isGenerating)

  // When generation completes (generating goes from true to false), trigger reveal animation
  useEffect(() => {
    if (!isGenerating && !revealed) {
      const t = setTimeout(() => setRevealed(true), 50)
      return () => clearTimeout(t)
    }
  }, [isGenerating]) // eslint-disable-line react-hooks/exhaustive-deps
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // Re-trigger height measurement when iframe is mounted (ref callback)
  const [iframeMounted, setIframeMounted] = useState(false)
  const iframeRefCallback = useCallback((node: HTMLIFrameElement | null) => {
    (iframeRef as any).current = node
    setIframeMounted(!!node)
  }, [])
  const scale = 0.5
  const isFixedHeight = deviceType === 'app' || deviceType === 'tablet'
  const initialHeight = isFixedHeight ? minHeight : 4000
  const [contentHeight, setContentHeight] = useState(initialHeight)
  const measuredRef = useRef(false)

  // Manual resize via drag handles — width fixed by default, changeable via drag
  const [manualWidth, setManualWidth] = useState<number | null>(screen.customWidth || null)
  const [manualHeight, setManualHeight] = useState<number | null>(screen.customHeight || null)
  const resizingRef = useRef<{ type: 'right' | 'bottom' | 'corner'; startX: number; startY: number; startW: number; startH: number } | null>(null)

  useEffect(() => {
    measuredRef.current = false
    setContentHeight(isFixedHeight ? minHeight : 4000)
  }, [screen.html, isFixedHeight, minHeight])

  // Direct DOM measurement via allow-same-origin sandbox + polling
  useEffect(() => {
    if (isFixedHeight) { setContentHeight(minHeight); return }
    const iframe = iframeRef.current
    if (!iframe) return
    // Skip if no real HTML yet (generating placeholder)
    if (!screen.html || screen.html.length < 100) return

    const measure = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        // #region agent log
        // #endregion
        if (!doc || !doc.body) return
        // Calculate actual content dimensions
        let h = 0
        const children = doc.body.children
        for (let ci = 0; ci < children.length; ci++) {
          const child = children[ci] as HTMLElement
          if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') continue
          const bottom = child.offsetTop + child.offsetHeight
          if (bottom > h) h = bottom
        }
        if (h < 50) h = Math.max(doc.body.scrollHeight, doc.body.offsetHeight)

        h += 20

        // Width is NOT auto-adjusted — use drag resize handles instead.
        // body.scrollWidth is unreliable (returns iframe width, not content width).

        // Auto-adjust height (only when no manual override)
        if (!manualHeight && h > 100 && h < 10000) {
          const measured = Math.max(h, minHeight)
          if (Math.abs(measured - contentHeight) > 10 || !measuredRef.current) {
            setContentHeight(measured)
            measuredRef.current = true
            onHeightMeasured?.(screen.id, measured)
          }
        }
      } catch (err) {
        // #region agent log
        // #endregion
      }
    }

    const onLoad = () => setTimeout(measure, 300)
    iframe.addEventListener('load', onLoad)

    // Polling: measure every 500ms for 15s (covers font loading + image decode)
    const poll = setInterval(measure, 500)
    const stop = setTimeout(() => clearInterval(poll), 15000)

    // Also use ResizeObserver on iframe body when accessible
    let resizeObs: ResizeObserver | null = null
    const tryObserve = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc?.body && !resizeObs) {
          resizeObs = new ResizeObserver(() => measure())
          resizeObs.observe(doc.body)
        }
      } catch { /* cross-origin */ }
    }
    const obsTimer = setTimeout(tryObserve, 1000)

    return () => {
      iframe.removeEventListener('load', onLoad)
      clearInterval(poll)
      clearTimeout(stop)
      clearTimeout(obsTimer)
      resizeObs?.disconnect()
    }
  }, [screen.html, isFixedHeight, minHeight, iframeMounted]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveWidth = manualWidth || width
  const height = manualHeight || contentHeight
  const displayWidth = effectiveWidth * scale
  const displayHeight = height * scale

  const isEditable = isSelected && editMode
  const showHeatmap = isSelected && heatmapMode && heatmapZones && heatmapZones.length > 0

  // Inject edit mode script and listen for element selection messages
  useEffect(() => {
    if (!isEditable || !onElementSelect) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__vs_element_selected') {
        onElementSelect({
          cssPath: e.data.cssPath,
          tagName: e.data.tagName,
          textPreview: e.data.textPreview,
          outerHtml: e.data.outerHtml,
        })
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [isEditable, onElementSelect])

  // Resolve heatmap zone rects via iframe postMessage
  const [resolvedZones, setResolvedZones] = useState<HeatmapZone[]>([])

  useEffect(() => {
    if (!showHeatmap || !heatmapZones) { setResolvedZones([]); return }

    const hasUnresolved = heatmapZones.some(z => z.rect.w === 0 && z.rect.h === 0)
    if (!hasUnresolved) { setResolvedZones(heatmapZones); return }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__vs_heatmap_rects') {
        const rects: { cssPath: string; x: number; y: number; w: number; h: number }[] = e.data.rects
        const updated = heatmapZones.map(zone => {
          const match = rects.find(r => r.cssPath === zone.cssPath)
          return match && match.w > 0 ? { ...zone, rect: match } : zone
        })
        setResolvedZones(updated)
      }
    }
    window.addEventListener('message', handler)

    const timer = setTimeout(() => {
      const iframe = iframeRef.current
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: '__vs_heatmap_probe',
          cssPaths: heatmapZones.map(z => z.cssPath),
        }, '*')
      }
    }, 500)

    return () => {
      window.removeEventListener('message', handler)
      clearTimeout(timer)
    }
  }, [showHeatmap, heatmapZones])

  const HEIGHT_OVERRIDE_CSS = `<style data-vs-height-fix>
html,body{height:auto!important;max-height:none!important;overflow:visible!important;min-height:0!important;}
body>*{min-height:0!important;}
*{max-height:none!important;}
[style*="min-height:100vh"],[style*="min-height: 100vh"]{min-height:0!important;}
[style*="height:100vh"],[style*="height: 100vh"]{height:auto!important;}
</style>`

  // Height is now measured directly via allow-same-origin; no injected script needed

  /**
   * Pre-process HTML for dynamic height: replace fixed viewport heights
   * with min-height so content can grow naturally beyond the iframe viewport.
   */
  function prepareHtmlForDynamicHeight(html: string): string {
    let h = html
    // In <style> blocks: remove all fixed heights that prevent shrinking
    h = h.replace(/(<style[\s\S]*?<\/style>)/gi, (styleBlock) => {
      return styleBlock
        .replace(/\bheight\s*:\s*100vh/gi, 'height:auto')
        .replace(/\bmin-height\s*:\s*100vh/gi, 'min-height:0')
        .replace(/\bheight\s*:\s*100%/gi, 'height:auto')
        .replace(/\bmin-height\s*:\s*100%/gi, 'min-height:0')
        .replace(/\boverflow\s*:\s*hidden/gi, 'overflow:visible')
    })
    // In inline styles
    h = h.replace(/style="([^"]*)"/gi, (_match, inner: string) => {
      const fixed = inner
        .replace(/\bheight\s*:\s*100vh/gi, 'height:auto')
        .replace(/\bmin-height\s*:\s*100vh/gi, 'min-height:0')
        .replace(/\bheight\s*:\s*100%/gi, 'height:auto')
        .replace(/\bmin-height\s*:\s*100%/gi, 'min-height:0')
      return `style="${fixed}"`
    })
    return h
  }

  // Build iframe HTML
  let iframeHtml = screen.html
  const injectedScripts: string[] = []
  if (isEditable) injectedScripts.push(EDIT_MODE_SCRIPT)
  else if (showHeatmap) injectedScripts.push(HEATMAP_PROBE_SCRIPT)

  // Pre-process HTML for dynamic height (desktop/web only)
  if (!isFixedHeight) {
    iframeHtml = prepareHtmlForDynamicHeight(iframeHtml)
  }

  // Inject CSS override and scripts robustly
  const cssToInject = !isFixedHeight ? HEIGHT_OVERRIDE_CSS : ''
  const scriptsToInject = injectedScripts.filter(Boolean).join('\n')

  if (cssToInject) {
    if (iframeHtml.includes('</head>')) {
      iframeHtml = iframeHtml.replace('</head>', cssToInject + '</head>')
    } else if (iframeHtml.includes('<body')) {
      iframeHtml = iframeHtml.replace(/<body/i, cssToInject + '<body')
    } else {
      iframeHtml = cssToInject + iframeHtml
    }
  }

  if (scriptsToInject) {
    if (iframeHtml.includes('</body>')) {
      iframeHtml = iframeHtml.replace('</body>', scriptsToInject + '</body>')
    } else {
      iframeHtml = iframeHtml + scriptsToInject
    }
  }

  // Generating placeholder: show animated skeleton
  if (isGenerating) {
    return (
      <div data-screen-card data-screen-dims={`${width}x${minHeight}`} className="flex flex-col cursor-default">
        <div className="flex items-center gap-1 mb-1 text-xs text-neutral-500">
          {deviceType === 'app' ? <PhoneSmallIcon /> : deviceType === 'tablet' ? <TabletSmallIcon /> : <MonitorSmallIcon />}
          <span>{screen.name}</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded animate-pulse">
            GENERATING
          </span>
        </div>
        <div
          className="relative rounded-xl border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 animate-pulse" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">AI Generating...</span>
          </div>
          {/* Shimmer skeleton lines */}
          <div className="absolute inset-x-6 top-[15%] space-y-3 opacity-30">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse w-full" />
            <div className="h-3 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse w-5/6" />
            <div className="h-8 bg-neutral-300 dark:bg-neutral-600 rounded-lg animate-pulse w-1/2 mt-4" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-screen-card
      data-screen-dims={`${width}x${height}`}
      className="flex flex-col cursor-pointer"
      style={{
        transition: 'opacity 700ms ease-out, transform 700ms ease-out, filter 700ms ease-out',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'scale(1)' : 'scale(0.95)',
        filter: revealed ? 'blur(0px)' : 'blur(8px)',
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center gap-1 mb-1 text-xs text-neutral-500">
        {isMultiSelected && (
          <span className="w-3.5 h-3.5 rounded-sm bg-violet-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">✓</span>
        )}
        {deviceType === 'app' ? <PhoneSmallIcon /> : deviceType === 'tablet' ? <TabletSmallIcon /> : <MonitorSmallIcon />}
        <span>{screen.name}</span>
        {isEditable && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">
            EDIT
          </span>
        )}
        {showHeatmap && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded">
            HEATMAP
          </span>
        )}
      </div>
      <div
        className={`relative rounded-xl border-2 overflow-hidden transition-colors ${
          showHeatmap
            ? 'border-orange-500 shadow-lg shadow-orange-500/30 ring-2 ring-orange-500/20'
            : isEditable
            ? 'border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20'
            : isMultiSelected
            ? 'border-violet-500 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/20'
            : isSelected
            ? 'border-blue-500 shadow-lg shadow-blue-500/20'
            : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-400'
        }`}
        style={{ width: displayWidth, height: displayHeight }}
      >
        <iframe
          ref={iframeRefCallback}
          srcDoc={iframeHtml}
          title={screen.name}
          sandbox={isFixedHeight ? 'allow-scripts' : 'allow-scripts allow-same-origin'}
          className={isEditable ? '' : 'pointer-events-none'}
          style={{
            width: effectiveWidth,
            height: height,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            border: 'none',
          }}
        />

        {/* Heatmap overlay */}
        {showHeatmap && resolvedZones.length > 0 && (
          <div
            data-heatmap-overlay
            className="absolute inset-0 pointer-events-auto"
            style={{ zIndex: 10 }}
          >
            {resolvedZones.filter(z => z.rect.w > 0).map((zone, i) => (
              <div
                key={i}
                data-heatmap-zone
                className="absolute cursor-pointer transition-all hover:brightness-110"
                title={`${zone.label} (${Math.round(zone.intensity * 100)}%)\n${zone.reason}`}
                style={{
                  left: zone.rect.x * scale,
                  top: zone.rect.y * scale,
                  width: zone.rect.w * scale,
                  height: zone.rect.h * scale,
                  background: `radial-gradient(ellipse at center, ${intensityColor(zone.intensity)}, transparent 70%)`,
                  border: `2px solid ${intensityBorder(zone.intensity)}`,
                  borderRadius: 8,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onHeatmapZoneClick?.(zone, e.clientX, e.clientY)
                }}
              >
                <span
                  className="absolute -top-5 left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                    background: intensityBorder(zone.intensity),
                    color: '#fff',
                  }}
                >
                  {zone.label} {Math.round(zone.intensity * 100)}%
                </span>
              </div>
            ))}

            {/* Fallback: show zones as evenly distributed grid if rects not resolved */}
            {resolvedZones.every(z => z.rect.w === 0) && resolvedZones.map((zone, i) => {
              const cols = 2
              const row = Math.floor(i / cols)
              const col = i % cols
              const zoneW = displayWidth / cols
              const zoneH = displayHeight / Math.ceil(resolvedZones.length / cols)
              return (
                <div
                  key={`fb-${i}`}
                  data-heatmap-zone
                  className="absolute cursor-pointer transition-all hover:brightness-110"
                  title={`${zone.label} (${Math.round(zone.intensity * 100)}%)\n${zone.reason}`}
                  style={{
                    left: col * zoneW + 4,
                    top: row * zoneH + 4,
                    width: zoneW - 8,
                    height: zoneH - 8,
                    background: `radial-gradient(ellipse at center, ${intensityColor(zone.intensity)}, transparent 70%)`,
                    border: `2px solid ${intensityBorder(zone.intensity)}`,
                    borderRadius: 8,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onHeatmapZoneClick?.(zone, e.clientX, e.clientY)
                  }}
                >
                  <span
                    className="absolute -top-5 left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{ background: intensityBorder(zone.intensity), color: '#fff' }}
                  >
                    {zone.label} {Math.round(zone.intensity * 100)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Resize handles — right, bottom, corner */}
        {isSelected && !isGenerating && (
          <>
            {/* Right handle */}
            <div
              className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-blue-500/20 transition-colors z-20"
              onMouseDown={(e) => {
                e.stopPropagation(); e.preventDefault()
                resizingRef.current = { type: 'right', startX: e.clientX, startY: e.clientY, startW: effectiveWidth, startH: height }
                const onMove = (ev: MouseEvent) => {
                  if (!resizingRef.current) return
                  setManualWidth(Math.max(200, resizingRef.current.startW + (ev.clientX - resizingRef.current.startX) / scale))
                }
                const onUp = () => {
                  if (onResize) onResize(screen.id, manualWidth || effectiveWidth, manualHeight || height)
                  resizingRef.current = null
                  document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp)
                }
                document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
              }}
            />
            {/* Bottom handle */}
            <div
              className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors z-20 group"
              onMouseDown={(e) => {
                e.stopPropagation(); e.preventDefault()
                resizingRef.current = { type: 'bottom', startX: e.clientX, startY: e.clientY, startW: effectiveWidth, startH: height }
                const onMove = (ev: MouseEvent) => {
                  if (!resizingRef.current) return
                  setManualHeight(Math.max(200, resizingRef.current.startH + (ev.clientY - resizingRef.current.startY) / scale))
                }
                const onUp = () => {
                  if (onResize) onResize(screen.id, manualWidth || effectiveWidth, manualHeight || height)
                  resizingRef.current = null
                  document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp)
                }
                document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
              }}
            >
              <div className="mx-auto w-12 h-1 rounded-full bg-blue-400/40 group-hover:bg-blue-400 mt-0.5 transition-colors" />
            </div>
            {/* Corner handle */}
            <div
              className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize z-20 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation(); e.preventDefault()
                resizingRef.current = { type: 'corner', startX: e.clientX, startY: e.clientY, startW: effectiveWidth, startH: height }
                const onMove = (ev: MouseEvent) => {
                  if (!resizingRef.current) return
                  setManualWidth(Math.max(200, resizingRef.current.startW + (ev.clientX - resizingRef.current.startX) / scale))
                  setManualHeight(Math.max(200, resizingRef.current.startH + (ev.clientY - resizingRef.current.startY) / scale))
                }
                const onUp = () => {
                  if (onResize) onResize(screen.id, manualWidth || effectiveWidth, manualHeight || height)
                  resizingRef.current = null
                  document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp)
                }
                document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
              }}
            >
              <svg className="w-3 h-3 text-blue-400 opacity-50" viewBox="0 0 10 10"><path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
            </div>
          </>
        )}
      </div>
      {isSelected && !isEditable && !showHeatmap && (
        <div className="text-[10px] text-blue-500 mt-1 text-center">{effectiveWidth} x {height}</div>
      )}
      {isEditable && (
        <div className="text-[10px] text-blue-500 mt-1 text-center">Click an element to select it</div>
      )}
      {showHeatmap && (
        <div className="text-[10px] text-orange-500 mt-1 text-center">Click a zone for actions</div>
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

function ToolButton({ icon, title, active, label, onClick }: { icon: React.ReactNode; title: string; active?: boolean; label?: string; onClick?: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg flex items-center gap-2 ${
        active ? 'bg-neutral-100 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
      }`}
    >
      {icon}
      {label && <span className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate">{label}</span>}
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
function ElementSelectIcon() {
  // Crosshair + element box icon — represents element-level selection
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="3 2" /></svg>
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
function PenSmallIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
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
function HeatmapSmallIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" opacity="0.5" /><circle cx="12" cy="12" r="10" opacity="0.25" /></svg>
}

function HeatmapActionMenu({ x, y, zone, onAction, onClose }: {
  x: number; y: number; zone: HeatmapZone
  onAction: (action: string) => void; onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const clampedX = Math.min(x, window.innerWidth - 300)
  const clampedY = Math.min(y, window.innerHeight - 420)

  const intensityColor = zone.intensity > 0.7
    ? 'text-red-500 bg-red-500/10 border-red-500/20'
    : zone.intensity > 0.4
    ? 'text-orange-500 bg-orange-500/10 border-orange-500/20'
    : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'

  const interactions = [
    { id: 'hover-effect', icon: '👆', label: 'Hover Effect', desc: 'Scale up + shadow on hover', color: 'from-blue-500/10 to-cyan-500/10' },
    { id: 'click-animation', icon: '💫', label: 'Click Animation', desc: 'Ripple or bounce on click', color: 'from-violet-500/10 to-purple-500/10' },
    { id: 'focus-state', icon: '🔲', label: 'Focus Ring', desc: 'Accessibility focus indicator', color: 'from-emerald-500/10 to-green-500/10' },
  ]

  const enhancements = [
    { id: 'make-prominent', icon: '🔍', label: 'Boost Visibility', desc: 'Increase size and contrast', color: 'from-amber-500/10 to-orange-500/10' },
    { id: 'improve-hierarchy', icon: '📊', label: 'Fix Hierarchy', desc: 'Adjust visual weight', color: 'from-rose-500/10 to-pink-500/10' },
    { id: 'micro-animation', icon: '✨', label: 'Micro-animation', desc: 'Subtle fade, pulse, or float', color: 'from-indigo-500/10 to-blue-500/10' },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-72 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm"
      style={{ left: clampedX, top: clampedY }}
    >
      {/* Header — element info + attention bar */}
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700/50">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${intensityColor}`}>
            {Math.round(zone.intensity * 100)}%
          </span>
          <span className="text-xs font-semibold truncate">{zone.label}</span>
        </div>
        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{zone.reason}</div>
        {/* Attention bar */}
        <div className="mt-2 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${zone.intensity * 100}%`,
              background: zone.intensity > 0.7 ? '#ef4444' : zone.intensity > 0.4 ? '#f97316' : '#eab308',
            }}
          />
        </div>
      </div>

      {/* Interaction effects */}
      <div className="px-2 pt-2 pb-1">
        <div className="px-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">Interactions</div>
        <div className="space-y-1">
          {interactions.map((item) => (
            <button
              key={item.id}
              onClick={() => onAction(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gradient-to-r ${item.color} transition-all group`}
            >
              <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
              <div className="text-left">
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-[10px] text-neutral-400">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px mx-3 bg-neutral-100 dark:bg-neutral-700/50" />

      {/* AI enhancements */}
      <div className="px-2 pt-2 pb-2">
        <div className="px-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">AI Enhance</div>
        <div className="space-y-1">
          {enhancements.map((item) => (
            <button
              key={item.id}
              onClick={() => onAction(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gradient-to-r ${item.color} transition-all group`}
            >
              <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
              <div className="text-left">
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-[10px] text-neutral-400">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
