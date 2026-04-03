import { useState } from 'react'

interface PromptBarProps {
  placeholder: string
  deviceType: 'app' | 'web' | 'tablet'
  onDeviceTypeChange: (type: 'app' | 'web' | 'tablet') => void
  onSubmit: (prompt: string) => void
  selectedScreen?: string
  onRemoveScreen?: () => void
}

export function PromptBar({
  placeholder,
  deviceType,
  onDeviceTypeChange,
  onSubmit,
  selectedScreen,
  onRemoveScreen,
}: PromptBarProps) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('3.0 Flash')
  const [showModelMenu, setShowModelMenu] = useState(false)

  const models = [
    { name: '3.0 Flash', desc: 'Fast generation. Great for iteration.' },
    { name: '3.0 Quality', desc: 'Maximum quality and reasoning.' },
    { name: 'Redesign', desc: 'Redesign existing apps. Attach a screenshot.' },
    { name: 'Ideate', desc: 'Bring a problem to solve and see solutions.' },
  ]

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim())
      setPrompt('')
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
      {/* Selected screen tag */}
      {selectedScreen && (
        <div className="px-4 pt-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-700">
            <span className="w-4 h-4 rounded-full bg-amber-400" />
            {selectedScreen}
            <button onClick={onRemoveScreen} className="ml-1 hover:text-neutral-600">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </span>
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
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Choose File">
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
              App
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
              Tablet
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
              Web
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
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Voice input">
            <MicIcon className="w-4 h-4" />
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-30 hover:opacity-90"
            title="Generate"
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
