import type { AgentLogEntry } from '../../pages/Editor'
import { useI18n } from '../../lib/i18n'

interface AgentLogProps {
  isOpen: boolean
  onToggle: () => void
  entries?: AgentLogEntry[]
  /** Set of log entry ids currently cancellable. Each gets a stop icon. */
  cancellableIds?: Set<string>
  /** Called when the user clicks the stop icon next to an entry. */
  onCancel?: (id: string) => void
}

export function AgentLog({ isOpen, onToggle, entries = [], cancellableIds, onCancel }: AgentLogProps) {
  const { t } = useI18n()
  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
      >
        <SparkleIcon className="w-4 h-4" />
        <span className="font-medium">{t('agentLog.title')}</span>
        {entries.length > 0 && (
          <span className="text-xs text-neutral-400">({entries.length})</span>
        )}
        <ChevronIcon className={`w-3 h-3 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-4 pb-3 max-h-40 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="text-sm text-neutral-500">
              {t('agentLog.empty')}
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry) => {
                const cancellable = !!cancellableIds?.has(entry.id) && !!onCancel
                return (
                  <div key={entry.id} className="flex items-start gap-2 text-sm">
                    <StatusIcon type={entry.type} />
                    <span className={
                      entry.type === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : entry.type === 'success'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : entry.type === 'generating'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }>
                      {entry.message}
                    </span>
                    <span className="text-[10px] text-neutral-400 ml-auto shrink-0">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    {cancellable && (
                      <button
                        onClick={() => onCancel?.(entry.id)}
                        title="이 작업 중지"
                        className="shrink-0 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                      >
                        <StopIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusIcon({ type }: { type: AgentLogEntry['type'] }) {
  if (type === 'generating') {
    return (
      <svg className="w-4 h-4 animate-spin shrink-0 text-amber-500 mt-0.5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'success') {
    return (
      <svg className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg className="w-4 h-4 shrink-0 text-red-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    )
  }
  return <SparkleIcon className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" />
}

function SparkleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" /></svg>
}

function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
}
function StopIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
}
