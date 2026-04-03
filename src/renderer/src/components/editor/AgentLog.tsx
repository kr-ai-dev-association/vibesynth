interface AgentLogProps {
  isOpen: boolean
  onToggle: () => void
}

export function AgentLog({ isOpen, onToggle }: AgentLogProps) {
  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
      >
        <SparkleIcon className="w-4 h-4" />
        <span className="font-medium">Agent log</span>
        <ChevronIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-4 pb-3 max-h-40 overflow-y-auto">
          <div className="text-sm text-neutral-500">
            No activity yet. Generate a design to see agent logs here.
          </div>
        </div>
      )}
    </div>
  )
}

function SparkleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" /></svg>
}

function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
}
