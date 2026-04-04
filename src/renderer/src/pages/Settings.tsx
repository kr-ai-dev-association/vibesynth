import { useI18n, type Locale } from '../lib/i18n'

interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { t, locale, setLocale } = useI18n()

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
                defaultValue="~/VibeSynth/projects"
                className="w-64 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
              />
            </SettingRow>
            <SettingRow label={t('settings.framework')} description={t('settings.frameworkDesc')}>
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>React + Vite</option>
              </select>
            </SettingRow>
            <SettingRow label={t('settings.devPort')} description={t('settings.devPortDesc')}>
              <input
                type="number"
                defaultValue={5173}
                className="w-24 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
              />
            </SettingRow>
          </Section>

          {/* AI */}
          <Section title={t('settings.ai')}>
            <SettingRow label={t('settings.apiKey')} description={t('settings.apiKeyDesc')}>
              <div className="flex gap-2">
                <input
                  type="password"
                  defaultValue="AIzaSy...ZgM"
                  className="w-64 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400"
                />
                <button className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                  {t('settings.show')}
                </button>
              </div>
            </SettingRow>
            <SettingRow label={t('settings.defaultModel')} description={t('settings.defaultModelDesc')}>
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>{t('settings.modelFast')}</option>
                <option>{t('settings.modelQuality')}</option>
                <option>{t('settings.modelRedesign')}</option>
                <option>{t('settings.modelIdeate')}</option>
              </select>
            </SettingRow>
          </Section>

          {/* Dev Server */}
          <Section title={t('settings.devServer')}>
            <SettingRow label={t('settings.packageManager')} description={t('settings.packageManagerDesc')}>
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>npm</option>
                <option>yarn</option>
                <option>pnpm</option>
                <option>bun</option>
              </select>
            </SettingRow>
            <SettingRow label={t('settings.autoStart')} description={t('settings.autoStartDesc')}>
              <ToggleSwitch defaultChecked />
            </SettingRow>
          </Section>

          {/* Editor */}
          <Section title={t('settings.editor')}>
            <SettingRow label={t('settings.externalEditor')} description={t('settings.externalEditorDesc')}>
              <select className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                <option>VS Code</option>
                <option>Cursor</option>
                <option>WebStorm</option>
              </select>
            </SettingRow>
          </Section>

          <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90">
              {t('settings.saveChanges')}
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
