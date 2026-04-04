import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { en } from './en'
import { ko } from './ko'

export type Locale = 'en' | 'ko'
export type TranslationKey = keyof typeof en

const translations: Record<Locale, Record<string, string>> = { en, ko }

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('vibesynth-lang')
    if (saved === 'ko' || saved === 'en') return saved
    return navigator.language.startsWith('ko') ? 'ko' : 'en'
  })

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('vibesynth-lang', l)
  }, [])

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] || translations.en[key] || key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return text
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
