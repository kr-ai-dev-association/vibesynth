interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  return (
    <div className="h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <header className="h-13 flex items-center px-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shrink-0 draggable">
        <div className="flex items-center no-drag">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 mr-3"
          >
            <ArrowLeftIcon />
          </button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-6 space-y-8">

          {/* General */}
          <Section title="General">
            <SettingRow label="Default project path" description="Where new projects are created">
              <input
                type="text"
                defaultValue="~/VibeSynth/projects"
                className="w-64 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
              />
            </SettingRow>
            <SettingRow label="Default framework" description="Framework for generated apps">
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>React + Vite</option>
              </select>
            </SettingRow>
            <SettingRow label="Default dev server port" description="Port for the local dev server">
              <input
                type="number"
                defaultValue={5173}
                className="w-24 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
              />
            </SettingRow>
          </Section>

          {/* AI */}
          <Section title="AI">
            <SettingRow label="API Key" description="Gemini API key for design generation">
              <div className="flex gap-2">
                <input
                  type="password"
                  defaultValue="AIzaSy...ZgM"
                  className="w-64 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
                />
                <button className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                  Show
                </button>
              </div>
            </SettingRow>
            <SettingRow label="Default model" description="AI model to use by default">
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>Fast</option>
                <option>Quality</option>
                <option>Redesign</option>
                <option>Ideate</option>
              </select>
            </SettingRow>
          </Section>

          {/* Dev Server */}
          <Section title="Dev Server">
            <SettingRow label="Package manager" description="npm, yarn, pnpm, or bun">
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>npm</option>
                <option>yarn</option>
                <option>pnpm</option>
                <option>bun</option>
              </select>
            </SettingRow>
            <SettingRow label="Auto-start on project open" description="Automatically start dev server when opening a project">
              <ToggleSwitch defaultChecked />
            </SettingRow>
          </Section>

          {/* Editor */}
          <Section title="Editor">
            <SettingRow label="External editor" description="Editor to open project files">
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>VS Code</option>
                <option>Cursor</option>
                <option>WebStorm</option>
              </select>
            </SettingRow>
          </Section>

          <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
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

function ToggleSwitch({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
      <div className="w-9 h-5 bg-neutral-300 peer-checked:bg-neutral-900 dark:bg-neutral-600 dark:peer-checked:bg-white rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-neutral-900 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
    </label>
  )
}

function ArrowLeftIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
}
