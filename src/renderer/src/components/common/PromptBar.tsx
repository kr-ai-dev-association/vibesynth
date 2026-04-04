import { useState } from 'react'
import { useI18n } from '../../lib/i18n'

interface PromptBarProps {
  placeholder: string
  deviceType: 'app' | 'web' | 'tablet'
  onDeviceTypeChange: (type: 'app' | 'web' | 'tablet') => void
  onSubmit: (prompt: string) => void
  selectedScreen?: string
  onRemoveScreen?: () => void
  editMode?: boolean
  selectedElement?: { tagName: string; textPreview: string }
  onExitEditMode?: () => void
  onClearElement?: () => void
}

export function PromptBar({
  placeholder,
  deviceType,
  onDeviceTypeChange,
  onSubmit,
  selectedScreen,
  onRemoveScreen,
  editMode,
  selectedElement,
  onExitEditMode,
  onClearElement,
}: PromptBarProps) {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('3.0 Flash')
  const [showModelMenu, setShowModelMenu] = useState(false)

  const models = [
    { name: t('promptBar.modelFlash'), desc: t('promptBar.modelFlashDesc') },
    { name: t('promptBar.modelQuality'), desc: t('promptBar.modelQualityDesc') },
    { name: t('promptBar.modelRedesign'), desc: t('promptBar.modelRedesignDesc') },
    { name: t('promptBar.modelIdeate'), desc: t('promptBar.modelIdeateDesc') },
  ]

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim())
      setPrompt('')
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
      {/* Selected screen tag + edit mode + element info */}
      {(selectedScreen || editMode) && (
        <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
          {selectedScreen && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-700">
              <span className="w-4 h-4 rounded-full bg-amber-400" />
              {selectedScreen}
              <button onClick={onRemoveScreen} className="ml-1 hover:text-neutral-600">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {editMode && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <EditPenIcon className="w-3 h-3" />
              {t('promptBar.editMode')}
              <button onClick={onExitEditMode} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100">
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {editMode && selectedElement && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 max-w-xs truncate">
              &lt;{selectedElement.tagName}&gt;
              {selectedElement.textPreview && (
                <span className="text-violet-500 dark:text-violet-400 truncate">"{selectedElement.textPreview.slice(0, 30)}"</span>
              )}
              <button onClick={onClearElement} className="ml-0.5 shrink-0 hover:text-violet-900 dark:hover:text-violet-100">
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Text input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full px-4 py-3 text-sm bg-transparent resize-none outline-none placeholder:text-neutral-400"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-1">
          {/* Add file */}
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title={t('promptBar.chooseFile')}>
            <PlusIcon className="w-4 h-4" />
          </button>

          {/* Device type toggle */}
          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-600 overflow-hidden">
            <button
              onClick={() => onDeviceTypeChange('app')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${
                deviceType === 'app'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              {t('promptBar.app')}
            </button>
            <button
              onClick={() => onDeviceTypeChange('tablet')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${
                deviceType === 'tablet'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <TabletIcon className="w-3.5 h-3.5" />
              {t('promptBar.tablet')}
            </button>
            <button
              onClick={() => onDeviceTypeChange('web')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${
                deviceType === 'web'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <MonitorIcon className="w-3.5 h-3.5" />
              {t('promptBar.web')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <DiamondIcon className="w-3 h-3" />
              {model}
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            {showModelMenu && (
              <div className="absolute bottom-full right-0 mb-1 w-72 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                {models.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      setModel(m.name)
                      setShowModelMenu(false)
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-start gap-2"
                  >
                    <SparkleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-neutral-500">{m.desc}</p>
                    </div>
                    {m.name === model && <CheckIcon className="w-4 h-4 ml-auto mt-0.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mic button */}
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title={t('promptBar.voiceInput')}>
            <MicIcon className="w-4 h-4" />
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-30 hover:opacity-90"
            title={t('common.generate')}
          >
            <ArrowUpIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Icons ---
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
}
function PhoneIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
}
function TabletIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M12 18h.01" /></svg>
}
function MonitorIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
}
function SparkleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7l3-7z" /></svg>
}
function DiamondIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12l10 10 10-10L12 2z" /></svg>
}
function ChevronDownIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
}
function MicIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="1" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v4M8 23h8" /></svg>
}
function ArrowUpIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
}
function EditPenIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
