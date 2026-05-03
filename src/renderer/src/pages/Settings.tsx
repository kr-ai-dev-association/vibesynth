import { useEffect, useState } from 'react'
import { useI18n, type Locale } from '../lib/i18n'

interface SettingsProps {
  onBack: () => void
}

const EMPTY_ANDROID: AndroidConfig = {
  sdkRoot: '', jdkHome: '', adbPath: '', emulatorPath: '', avdManagerPath: '', preferredAvd: '',
}

interface GeneralSettings {
  projectPath: string
  framework: string
  devPort: number
  apiKey: string
  defaultModel: string
  packageManager: string
  autoStart: boolean
}

const DEFAULT_GENERAL: GeneralSettings = {
  projectPath: '~/VibeSynth/workspaces',
  framework: 'React + Vite',
  devPort: 5173,
  apiKey: '',
  defaultModel: 'fast',
  packageManager: 'npm',
  autoStart: true,
}

export function Settings({ onBack }: SettingsProps) {
  const { t, locale, setLocale } = useI18n()

  const [general, setGeneral] = useState<GeneralSettings>(DEFAULT_GENERAL)
  const [androidCfg, setAndroidCfg] = useState<AndroidConfig>(EMPTY_ANDROID)
  const [banyaCliCfg, setBanyaCliCfg] = useState<BanyaCliConfig>(DEFAULT_BANYA_CLI_CFG)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load persisted settings on mount.
  useEffect(() => {
    (async () => {
      const s = await window.electronAPI?.db.getSettings('default') as any
      if (!s) return
      setGeneral({
        projectPath: s.projectPath ?? DEFAULT_GENERAL.projectPath,
        framework: s.framework ?? DEFAULT_GENERAL.framework,
        devPort: s.devPort ?? DEFAULT_GENERAL.devPort,
        apiKey: s.apiKey ?? '',
        defaultModel: s.defaultModel ?? DEFAULT_GENERAL.defaultModel,
        packageManager: s.packageManager ?? DEFAULT_GENERAL.packageManager,
        autoStart: s.autoStart ?? DEFAULT_GENERAL.autoStart,
      })
      if (s.androidConfig) {
        setAndroidCfg({ ...EMPTY_ANDROID, ...s.androidConfig })
      }
      if (s.banyaCliConfig) {
        setBanyaCliCfg({ ...DEFAULT_BANYA_CLI_CFG, ...s.banyaCliConfig })
      }
    })()
  }, [])

  const updateGeneral = <K extends keyof GeneralSettings>(k: K, v: GeneralSettings[K]) => {
    setGeneral((g) => ({ ...g, [k]: v }))
    setSaveState('idle')
  }

  const handleSave = async () => {
    setSaveState('saving')
    try {
      const existing = await window.electronAPI?.db.getSettings('default') as any
      await window.electronAPI?.db.saveSettings({
        ...(existing || {}),
        userId: 'default',
        ...general,
        androidConfig: androidCfg,
        banyaCliConfig: banyaCliCfg, // unified save — no more per-section save buttons
      })
      // Propagate the new Gemini key to the renderer's gemini.ts singleton
      // so subsequent calls in this session use it without an app restart.
      if (general.apiKey?.trim()) {
        try {
          const { setActiveGeminiKey } = await import('../lib/gemini')
          setActiveGeminiKey(general.apiKey.trim())
        } catch { /* ignore — renderer not ready */ }
      }
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2500)
    }
  }

  return (
    <div className="h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* Window drag bar */}
      <div className="h-3 shrink-0 draggable bg-white dark:bg-neutral-800" />
      {/* Header toolbar */}
      <header className="h-10 flex items-center px-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 mr-3"
          >
            <ArrowLeftIcon />
          </button>
          <h1 className="text-lg font-semibold">{t('settings.title')}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-6 space-y-8">

          {/* General */}
          <Section title={t('settings.general')}>
            <SettingRow label={t('settings.language')} description={t('settings.languageDesc')}>
              <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <LangButton value="en" label={t('settings.langEnglish')} current={locale} onSelect={setLocale} />
                <LangButton value="ko" label={t('settings.langKorean')} current={locale} onSelect={setLocale} />
              </div>
            </SettingRow>
            <SettingRow label={t('settings.projectPath')} description={t('settings.projectPathDesc')}>
              <input
                type="text"
                value={general.projectPath}
                onChange={(e) => updateGeneral('projectPath', e.target.value)}
                className="w-64 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
              />
            </SettingRow>
            <SettingRow label={t('settings.framework')} description={t('settings.frameworkDesc')}>
              <select
                value={general.framework}
                onChange={(e) => updateGeneral('framework', e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
              >
                <option>React + Vite</option>
              </select>
            </SettingRow>
            <SettingRow label={t('settings.devPort')} description={t('settings.devPortDesc')}>
              <input
                type="number"
                value={general.devPort}
                onChange={(e) => updateGeneral('devPort', Number(e.target.value) || 5173)}
                className="w-24 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
              />
            </SettingRow>
          </Section>

          {/* AI */}
          <Section title={t('settings.ai')}>
            <div className="py-2">
              <p className="text-sm font-medium mb-2">{t('settings.apiKey')}</p>
              <ApiKeyInput
                value={general.apiKey}
                onChange={(v) => updateGeneral('apiKey', v)}
                show={showApiKey}
                onToggleShow={() => setShowApiKey((v) => !v)}
                showLabel={t('settings.show')}
                hideLabel={t('settings.hide')}
              />
            </div>
            <SettingRow label={t('settings.defaultModel')} description={t('settings.defaultModelDesc')}>
              <select
                value={general.defaultModel}
                onChange={(e) => updateGeneral('defaultModel', e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
              >
                <option value="fast">{t('settings.modelFast')}</option>
                <option value="quality">{t('settings.modelQuality')}</option>
                <option value="redesign">{t('settings.modelRedesign')}</option>
                <option value="ideate">{t('settings.modelIdeate')}</option>
              </select>
            </SettingRow>
          </Section>

          {/* Dev Server */}
          <Section title={t('settings.devServer')}>
            <SettingRow label={t('settings.packageManager')} description={t('settings.packageManagerDesc')}>
              <select
                value={general.packageManager}
                onChange={(e) => updateGeneral('packageManager', e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
              >
                <option>npm</option>
                <option>yarn</option>
                <option>pnpm</option>
                <option>bun</option>
              </select>
            </SettingRow>
            <SettingRow label={t('settings.autoStart')} description={t('settings.autoStartDesc')}>
              <ToggleSwitch
                checked={general.autoStart}
                onChange={(v) => updateGeneral('autoStart', v)}
              />
            </SettingRow>
          </Section>

          {/* banya CLI (build agent) */}
          <BanyaCliSection
            cfg={banyaCliCfg}
            onChange={(next) => { setBanyaCliCfg(next); setSaveState('idle') }}
          />

          {/* Android build environment */}
          <AndroidSection
            cfg={androidCfg}
            onChange={(next) => { setAndroidCfg(next); setSaveState('idle') }}
          />

          {/* Editor */}
          <Section title={t('settings.editor')}>
            <SettingRow label={t('settings.externalEditor')} description={t('settings.externalEditorDesc')}>
              <ExternalEditorSelect />
            </SettingRow>
          </Section>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {saveState === 'saved' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ 저장 완료</span>
            )}
            {saveState === 'error' && (
              <span className="text-xs text-red-600 dark:text-red-400">✗ 저장 실패</span>
            )}
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50"
            >
              {saveState === 'saving' ? '저장 중…' : t('settings.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LangButton({ value, label, current, onSelect }: { value: Locale; label: string; current: Locale; onSelect: (l: Locale) => void }) {
  const active = current === value
  return (
    <button
      onClick={() => onSelect(value)}
      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
          : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'
      }`}
    >
      {label}
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h2>
      <div className="space-y-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        {children}
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  )
}

function ToggleSwitch({ checked, onChange, defaultChecked }: { checked?: boolean; onChange?: (v: boolean) => void; defaultChecked?: boolean }) {
  const isControlled = checked !== undefined && onChange !== undefined
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        {...(isControlled
          ? { checked, onChange: (e) => onChange(e.target.checked) }
          : { defaultChecked })}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-neutral-300 peer-checked:bg-neutral-900 dark:bg-neutral-600 dark:peer-checked:bg-white rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-neutral-900 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
    </label>
  )
}

function ArrowLeftIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
}

// ─── Gemini API key input with format validation ──────────────
//
// Real Gemini keys match `AIzaSy[A-Za-z0-9_-]{33}` — total 39 chars.
// We had a real corruption bug where a paste-cycle on the show/hide
// toggle ended up storing a 78-char duplicated key, which the API
// silently rejected with API_KEY_INVALID. This component:
//   - validates length + pattern on every change
//   - rejects pastes that look like duplications (e.g. "AIza...AIza...")
//     with a quick auto-trim option
//   - surfaces a red border + error hint until the value is plausible

const GEMINI_KEY_RE = /^AIzaSy[A-Za-z0-9_-]{33}$/

function detectDuplicatedKey(s: string): string | null {
  // Pattern we've seen: "<prefix><prefix><suffix><suffix>" where prefix
  // and suffix are both halves of a real key. Try to recover by scanning
  // for two consecutive valid-looking keys joined together.
  const matches = s.match(/AIzaSy[A-Za-z0-9_-]{33}/g)
  if (matches && matches.length >= 1) return matches[0]
  // Fallback: pattern AAAABBBB where each duplicate. Find the first
  // 39-char window that matches the regex.
  for (let i = 0; i + 39 <= s.length; i++) {
    const slice = s.slice(i, i + 39)
    if (GEMINI_KEY_RE.test(slice)) return slice
  }
  return null
}

function ApiKeyInput({
  value, onChange, show, onToggleShow, showLabel, hideLabel,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  showLabel: string
  hideLabel: string
}) {
  const trimmed = value.trim()
  const isEmpty = !trimmed
  const looksValid = isEmpty || GEMINI_KEY_RE.test(trimmed)
  const recoverable = !looksValid ? detectDuplicatedKey(trimmed) : null

  const handleChange = (raw: string) => {
    // Always strip leading/trailing whitespace + collapse internal whitespace
    // (some terminal pastes include accidental spaces or newlines).
    const cleaned = raw.replace(/\s+/g, '')
    onChange(cleaned)
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex gap-2 w-full">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onPaste={(e) => {
            // Replace selection with cleaned pasted text instead of letting
            // the browser concatenate — this kills the "show toggle paste
            // duplication" failure mode that produced the 78-char key bug.
            e.preventDefault()
            const pasted = e.clipboardData.getData('text').replace(/\s+/g, '')
            handleChange(pasted)
          }}
          placeholder="AIzaSy..."
          spellCheck={false}
          className={`flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400 font-mono ${
            looksValid
              ? 'border-neutral-200 dark:border-neutral-700'
              : 'border-red-400 dark:border-red-500'
          }`}
        />
        <button
          onClick={onToggleShow}
          className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 shrink-0"
        >
          {show ? hideLabel : showLabel}
        </button>
      </div>
      {!looksValid && (
        <div className="flex items-center gap-2 text-[11px] text-red-600 dark:text-red-400">
          <span>
            ⚠ 형식 이상 — 길이 {trimmed.length}자 (정상 39자, AIzaSy 로 시작 + 33자 영숫자)
          </span>
          {recoverable && recoverable !== trimmed && (
            <button
              type="button"
              onClick={() => onChange(recoverable)}
              className="px-2 py-0.5 rounded border border-red-400 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              자동 수정 ({recoverable.slice(0, 8)}...{recoverable.slice(-4)})
            </button>
          )}
        </div>
      )}
      {looksValid && !isEmpty && (
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
          ✓ 형식 OK ({trimmed.length}자)
        </div>
      )}
    </div>
  )
}

// ─── External editor select (persisted to localStorage) ────────

const EDITOR_OPTIONS = [
  { value: 'vscode', label: 'VS Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'webstorm', label: 'WebStorm' },
  { value: 'android-studio', label: 'Android Studio' },
] as const

type EditorChoice = typeof EDITOR_OPTIONS[number]['value']

function ExternalEditorSelect() {
  const [choice, setChoice] = useState<EditorChoice>(() => {
    const saved = localStorage.getItem('vibesynth-external-editor') as EditorChoice | null
    return saved && EDITOR_OPTIONS.some((e) => e.value === saved) ? saved : 'vscode'
  })
  const onChange = (v: EditorChoice) => {
    setChoice(v)
    localStorage.setItem('vibesynth-external-editor', v)
  }
  return (
    <select
      value={choice}
      onChange={(e) => onChange(e.target.value as EditorChoice)}
      className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
    >
      {EDITOR_OPTIONS.map((e) => (
        <option key={e.value} value={e.value}>{e.label}</option>
      ))}
    </select>
  )
}

// ─── banya CLI (build agent) section ───────────────────────────

const DEFAULT_BANYA_CLI_CFG: BanyaCliConfig = {
  explicitPath: '',
  agentModelMode: 'fixed',
  fixedModel: 'gemini-2.0-flash',
  criticEnabled: false,
}

function BanyaCliSection({ cfg, onChange }: {
  cfg: BanyaCliConfig
  onChange: (next: BanyaCliConfig) => void
}) {
  const [info, setInfo] = useState<BanyaCliInfo | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // 'detect'

  // Auto-detect on mount so the status pill shows even before user clicks anything.
  useEffect(() => {
    window.electronAPI?.banyaCli.detect(cfg.explicitPath).then((r) => { if (r) setInfo(r) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = <K extends keyof BanyaCliConfig>(k: K, v: BanyaCliConfig[K]) => {
    onChange({ ...cfg, [k]: v })
  }

  const handleDetect = async () => {
    setBusy('detect')
    try {
      const r = await window.electronAPI?.banyaCli.detect(cfg.explicitPath)
      if (r) {
        setInfo(r)
        if (!cfg.explicitPath && r.available && r.path) update('explicitPath', r.path)
      }
    } finally { setBusy(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">banya CLI (Build Agent)</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDetect}
            disabled={busy !== null}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50"
          >
            {busy === 'detect' ? '검증 중…' : '검증'}
          </button>
          <span className="text-[11px] text-neutral-500">↓ 하단 "변경사항 저장" 버튼으로 저장</span>
        </div>
      </div>

      <div className="space-y-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">

        {/* Status indicator */}
        {info && (
          <div className={`text-xs px-3 py-2 rounded-lg ${
            info.available
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {info.available
              ? `✓ 설치됨 — ${info.version || 'unknown version'} @ ${info.path}`
              : `✗ ${info.error || 'banya CLI 사용 불가'}`}
            {!info.available && (
              <div className="mt-1 text-[11px] opacity-80 font-mono">
                설치: <code>cd /path/to/banya-framework && make</code>
              </div>
            )}
          </div>
        )}

        {/* Path */}
        <SettingRow
          label="banya 바이너리 경로"
          description="비워두면 PATH / ~/.local/bin / /usr/local/bin / /opt/homebrew/bin 자동 탐색"
        >
          <input
            type="text"
            value={cfg.explicitPath}
            onChange={(e) => update('explicitPath', e.target.value)}
            placeholder="(자동 감지)"
            spellCheck={false}
            className="w-80 px-3 py-1.5 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
          />
        </SettingRow>

        {/* Model — fixed Gemini (default) */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
          <SettingRow
            label="Build agent 모델"
            description="vibesynth 의 빌드 (React / Android codegen) 가 사용할 Gemini 모델"
          >
            <select
              value={cfg.fixedModel}
              onChange={(e) => update('fixedModel', e.target.value)}
              disabled={cfg.agentModelMode !== 'fixed'}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none disabled:opacity-50"
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash — 빠름 (멀티모달)</option>
              <option value="gemini-3.1-pro">gemini-3.1-pro — 고품질 (멀티모달)</option>
            </select>
          </SettingRow>
        </div>

        {/* Critic */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
          <SettingRow
            label="Critic (재검토 단계)"
            description="빌드 결과를 한번 더 LLM 으로 검증 — 품질 ↑, 시간 ↑. 켜면 아래 고급 옵션이 활성화됩니다."
          >
            <ToggleSwitch
              checked={cfg.criticEnabled}
              onChange={(v) => {
                update('criticEnabled', v)
                // Critic OFF → also force agent back to fixed mode so advanced
                // toggle never silently keeps a stale "cli-default" choice.
                if (!v && cfg.agentModelMode === 'cli-default') {
                  update('agentModelMode', 'fixed')
                }
              }}
            />
          </SettingRow>
        </div>

        {/* Advanced — only enabled when Critic is on. Disabled-grayed when off. */}
        <details
          className={`border-t border-neutral-200 dark:border-neutral-700 pt-3 ${
            cfg.criticEnabled ? '' : 'opacity-50 pointer-events-none'
          }`}
          aria-disabled={!cfg.criticEnabled}
        >
          <summary className="cursor-pointer text-xs text-neutral-500 select-none">
            고급 옵션 — banya CLI 설정 사용
            {!cfg.criticEnabled && <span className="ml-2 italic">(Critic 을 켜면 활성)</span>}
          </summary>
          <div className="mt-2 pl-4">
            <label className="flex items-start gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={cfg.agentModelMode === 'cli-default'}
                onChange={(e) => update('agentModelMode', e.target.checked ? 'cli-default' : 'fixed')}
                disabled={!cfg.criticEnabled}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm">CLI 의 메인 모델 + Critic 설정 사용</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  체크 시 위의 모델 셀렉트가 무시되고 <code>~/.banya</code> 의 사용자 설정으로 빌드 실행.
                  CLI 측 모델 / Critic 은 <code>banya config</code> 또는 <code>banya login</code> 으로 관리.
                </div>
              </div>
            </label>
          </div>
        </details>

      </div>
    </div>
  )
}

// ─── Android build environment section ─────────────────────────

function AndroidSection({ cfg, onChange }: {
  cfg: AndroidConfig
  onChange: (next: AndroidConfig) => void
}) {
  const [validation, setValidation] = useState<AndroidValidationResult | null>(null)
  const [avds, setAvds] = useState<AvdInfo[]>([])
  const [busy, setBusy] = useState<string | null>(null) // 'detect' | 'validate'

  // When emulator path is filled, refresh AVD list (cheap call).
  useEffect(() => {
    if (!cfg.emulatorPath) { setAvds([]); return }
    window.electronAPI?.android.listAvds(cfg.emulatorPath).then((list) => setAvds(list || []))
  }, [cfg.emulatorPath])

  const update = (k: keyof AndroidConfig, v: string) => onChange({ ...cfg, [k]: v })

  const handleAutoDetect = async () => {
    setBusy('detect')
    try {
      const detected = await window.electronAPI?.android.detect()
      if (detected) {
        // Preserve user's preferredAvd if already set.
        onChange({ ...detected, preferredAvd: cfg.preferredAvd || detected.preferredAvd || '' })
      }
    } finally { setBusy(null) }
  }

  const handleValidate = async () => {
    setBusy('validate')
    try {
      const r = await window.electronAPI?.android.validate(cfg)
      setValidation(r || null)
    } finally { setBusy(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Android 빌드 환경</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoDetect}
            disabled={busy !== null}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50"
          >
            {busy === 'detect' ? '감지 중…' : '자동 감지'}
          </button>
          <button
            onClick={handleValidate}
            disabled={busy !== null}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50"
          >
            {busy === 'validate' ? '검증 중…' : '검증'}
          </button>
          <span className="text-[11px] text-neutral-500">↓ 하단 "변경사항 저장" 버튼으로 저장</span>
        </div>
      </div>

      <div className="space-y-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <AndroidPathRow
          label="ANDROID_HOME (SDK)"
          desc="예: ~/Library/Android/sdk"
          value={cfg.sdkRoot}
          onChange={(v) => update('sdkRoot', v)}
          status={validation?.sdkRoot}
        />
        <AndroidPathRow
          label="JAVA_HOME (JDK 17+)"
          desc="Gradle 빌드용. openjdk@17 권장"
          value={cfg.jdkHome}
          onChange={(v) => update('jdkHome', v)}
          status={validation?.jdkHome}
        />
        <AndroidPathRow
          label="adb"
          desc="<sdk>/platform-tools/adb"
          value={cfg.adbPath}
          onChange={(v) => update('adbPath', v)}
          status={validation?.adb}
        />
        <AndroidPathRow
          label="emulator"
          desc="<sdk>/emulator/emulator"
          value={cfg.emulatorPath}
          onChange={(v) => update('emulatorPath', v)}
          status={validation?.emulator}
        />
        <AndroidPathRow
          label="avdmanager"
          desc="<sdk>/cmdline-tools/latest/bin/avdmanager 또는 homebrew"
          value={cfg.avdManagerPath}
          onChange={(v) => update('avdManagerPath', v)}
          status={validation?.avdManager}
        />

        <div className="flex items-start justify-between gap-4 py-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
          <div>
            <p className="text-sm font-medium">선호 AVD</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              빌드 후 자동 부팅할 emulator. {avds.length === 0 ? '(emulator 경로 검증 필요)' : `등록된 AVD: ${avds.length}개`}
            </p>
            {validation?.preferredAvd && (
              <p className={`text-xs mt-1 ${validation.preferredAvd.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {validation.preferredAvd.ok ? '✓' : '✗'} {validation.preferredAvd.message}
                {validation.preferredAvd.detail && <span className="block opacity-70 font-mono">{validation.preferredAvd.detail}</span>}
              </p>
            )}
          </div>
          <select
            value={cfg.preferredAvd}
            onChange={(e) => update('preferredAvd', e.target.value)}
            disabled={avds.length === 0}
            className="w-64 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none disabled:opacity-50"
          >
            <option value="">— 선택 —</option>
            {avds.map((a) => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>

        {validation && (
          <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${
            validation.overall === 'ok'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : validation.overall === 'partial'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            전체 상태: {validation.overall === 'ok' ? '✓ Android 빌드 가능' : validation.overall === 'partial' ? '⚠ 일부 누락 — Android 빌드 시 실패 가능' : '✗ 환경 미구성'}
          </div>
        )}
      </div>
    </div>
  )
}

function AndroidPathRow({
  label, desc, value, onChange, status,
}: {
  label: string; desc: string; value: string
  onChange: (v: string) => void
  status?: AndroidFieldStatus
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
        {status && (
          <p className={`text-xs mt-1 ${status.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {status.ok ? '✓' : '✗'} {status.message}
            {status.detail && <span className="block opacity-70 font-mono break-all">{status.detail}</span>}
          </p>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-96 max-w-[60%] px-3 py-1.5 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
      />
    </div>
  )
}
