import type { Project } from '../App'
import type { Locale } from './i18n'
import { enExampleNames, enCategoryLabels, enPrds, enSuggestions } from './i18n/en-examples'
import { koExampleNames, koCategoryLabels, koPrds, koSuggestions } from './i18n/ko-examples'

export type ExampleCategory = 'landing' | 'homepage' | 'dashboard' | 'iphone' | 'android' | 'ipad'

export interface ExampleProject {
  project: Project
  category: ExampleCategory
  categoryLabel: string
  emoji: string
  gradient: string
  recommendedDesignId: string
  prd: string
}

const categoryMeta: { id: ExampleCategory; icon: string }[] = [
  { id: 'landing', icon: '🚀' },
  { id: 'homepage', icon: '🏠' },
  { id: 'dashboard', icon: '📊' },
  { id: 'iphone', icon: '📱' },
  { id: 'android', icon: '🤖' },
  { id: 'ipad', icon: '📋' },
]

export function getExampleCategories(locale: Locale) {
  const labels = locale === 'ko' ? koCategoryLabels : enCategoryLabels
  return categoryMeta.map(c => ({ ...c, label: labels[c.id] || c.id }))
}

export function getSuggestions(locale: Locale) {
  return locale === 'ko' ? koSuggestions : enSuggestions
}

const prompts: Record<string, string> = {
  'ex-landing': 'A desktop landing page for "LifeFlow" — an AI life pattern tracking service. Gradient blue-to-purple hero, clean white feature section, modern sans-serif typography. Sticky navigation with logo. screens: Hero Landing, Features & Pricing, Footer & CTA',
  'ex-homepage': 'A corporate homepage for "LifeFlow Inc.", the company behind the LifeFlow AI life pattern tracking app. Clean corporate style with white base, navy text, serif headings, generous whitespace. screens: Home, About & Team, Service & Products, Careers',
  'ex-dashboard': 'A dark-themed admin dashboard for "LifeFlow" member management. Dark background (#0f1117), orange (#FF7849) accent, clean data-focused design. Sidebar navigation (Overview, Members, Subscriptions, Analytics, Support, Settings). screens: Overview Dashboard, Member List, Member Detail',
  'ex-iphone': 'A native iOS mobile app (390px width) for "LifeFlow" — AI life pattern tracking. Warm mint/green palette, white background, soft card shadows, rounded corners 16px, iOS-style design with status bar 9:41 and bottom nav. screens: Today Home, Insights, Log Entry, Profile & Achievements',
  'ex-android': 'A Material Design 3 Android app (390px width) for "LifeFlow" — AI life pattern tracking. Warm orange/coral palette, Material Design 3 elevation, rounded cards 12px, FAB, bottom navigation. screens: Home, AI Coach Chat, Progress & Goals, Community',
  'ex-ipad': 'A tablet app (1024px portrait) for "LifeFlow" — AI life pattern tracking on iPad. Calm lavender/purple palette, iPadOS-style sidebar, generous whitespace, large typography, card-based hierarchy. screens: Dashboard Split View, Journal, Family Hub, Insights Report',
}

const gradients: Record<string, string> = {
  'ex-landing': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'ex-homepage': 'linear-gradient(135deg, #1a365d 0%, #2a4a7f 50%, #e2e8f0 100%)',
  'ex-dashboard': 'linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #FF7849 100%)',
  'ex-iphone': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'ex-android': 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
  'ex-ipad': 'linear-gradient(135deg, #c3cfe2 0%, #a18cd1 50%, #fbc2eb 100%)',
}

const designIds: Record<string, string> = {
  'ex-landing': 'pin-gradient-cards',
  'ex-homepage': 'pin-blue-dashboard',
  'ex-dashboard': 'pin-finance-dashboard',
  'ex-iphone': 'pin-mint-dashboard',
  'ex-android': 'pin-orange-crm',
  'ex-ipad': 'pin-purple-analytics',
}

const deviceTypes: Record<string, 'web' | 'app' | 'tablet'> = {
  'ex-landing': 'web',
  'ex-homepage': 'web',
  'ex-dashboard': 'web',
  'ex-iphone': 'app',
  'ex-android': 'app',
  'ex-ipad': 'tablet',
}

const emojis: Record<string, string> = {
  'ex-landing': '🚀',
  'ex-homepage': '🏠',
  'ex-dashboard': '📊',
  'ex-iphone': '📱',
  'ex-android': '🤖',
  'ex-ipad': '📋',
}

const exampleIds = ['ex-landing', 'ex-homepage', 'ex-dashboard', 'ex-iphone', 'ex-android', 'ex-ipad'] as const

export function getExampleProjects(locale: Locale): ExampleProject[] {
  const names = locale === 'ko' ? koExampleNames : enExampleNames
  const labels = locale === 'ko' ? koCategoryLabels : enCategoryLabels
  const prds = locale === 'ko' ? koPrds : enPrds

  return exampleIds.map(id => {
    const cat = categoryMeta.find(c => `ex-${c.id}` === id)!
    return {
      project: {
        id,
        name: names[id] || id,
        prompt: prompts[id],
        updatedAt: new Date().toLocaleDateString(),
        screens: [],
        deviceType: deviceTypes[id],
      },
      category: cat.id,
      categoryLabel: labels[cat.id] || cat.id,
      emoji: emojis[id],
      gradient: gradients[id],
      recommendedDesignId: designIds[id],
      prd: prds[id] || '',
    }
  })
}

// Backward-compatible static export for non-locale-aware code
export const EXAMPLE_CATEGORIES = categoryMeta.map(c => ({
  ...c,
  label: enCategoryLabels[c.id] || c.id,
}))

export const EXAMPLE_PROJECTS: ExampleProject[] = getExampleProjects('en')
