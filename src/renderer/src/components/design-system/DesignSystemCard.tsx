interface ColorRole {
  base: string
  tones: string[] // T0,T10,T20,T30,T40,T50,T60,T70,T80,T90,T95,T100
}

interface DesignSystemCardProps {
  name: string
  colors: {
    primary: ColorRole
    secondary: ColorRole
    tertiary: ColorRole
    neutral: ColorRole
  }
  typography: {
    headline: { family: string }
    body: { family: string }
    label: { family: string }
  }
}

const TONE_LABELS = ['T0','T10','T20','T30','T40','T50','T60','T70','T80','T90','T95','T100']

export function DesignSystemCard({ name, colors, typography }: DesignSystemCardProps) {
  const colorRoles = [
    { label: 'Primary', ...colors.primary },
    { label: 'Secondary', ...colors.secondary },
    { label: 'Tertiary', ...colors.tertiary },
    { label: 'Neutral', ...colors.neutral },
  ]

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  return (
    <div className="w-80 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <PaletteIcon className="w-4 h-4 text-neutral-500" />
        <span className="text-sm font-medium">{name}</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Color Palette */}
        {colorRoles.map((role) => (
          <div key={role.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{role.label}</span>
              <button
                onClick={() => handleCopy(role.base)}
                className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                title="Click to copy"
              >
                {role.base}
              </button>
            </div>
            <div className="flex gap-0.5">
              {role.tones.map((tone, i) => (
                <button
                  key={i}
                  onClick={() => handleCopy(tone)}
                  className="flex-1 h-5 rounded-sm cursor-pointer hover:ring-2 hover:ring-neutral-400 hover:z-10 relative group"
                  style={{ backgroundColor: tone }}
                  title={`${TONE_LABELS[i]} ${tone}`}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[9px] bg-neutral-800 text-white px-1 py-0.5 rounded whitespace-nowrap z-20">
                    {TONE_LABELS[i]} {tone}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Typography */}
        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          {Object.entries(typography).map(([level, { family }]) => (
            <div key={level} className="flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 capitalize">{level}</span>
                <span className="text-xs text-neutral-400 ml-1.5">{family}</span>
              </div>
              <span className="text-lg font-semibold" style={{ fontFamily: family }}>Aa</span>
            </div>
          ))}
        </div>

        {/* Components Preview */}
        <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          {/* Buttons */}
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <button className="px-3 py-1 text-xs rounded-full text-white" style={{ backgroundColor: colors.primary.base }}>Primary</button>
              <button className="px-3 py-1 text-xs rounded-full text-white" style={{ backgroundColor: colors.secondary.base }}>Secondary</button>
            </div>
            <div className="flex gap-1.5">
              <button className="px-3 py-1 text-xs rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900">Inverted</button>
              <button className="px-3 py-1 text-xs rounded-full border border-current">Outlined</button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-400 text-xs">
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Search</span>
          </div>

          {/* Bottom nav icons */}
          <div className="flex justify-center gap-6 py-1">
            <NavIcon label="home" />
            <NavIcon label="search" />
            <NavIcon label="person" />
          </div>

          {/* Icon set */}
          <div className="flex gap-2 text-neutral-500">
            <span className="text-xs">✨</span>
            <span className="text-xs">📦</span>
            <span className="text-xs">🏷</span>
            <span className="text-xs">🗑</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavIcon({ label }: { label: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>,
    search: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    person: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  }
  return <span className="text-neutral-500">{icons[label]}</span>
}

function PaletteIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="8" r="1.5" fill="currentColor" /><circle cx="8" cy="12" r="1.5" fill="currentColor" /><circle cx="16" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="16" r="1.5" fill="currentColor" /></svg>
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
}
