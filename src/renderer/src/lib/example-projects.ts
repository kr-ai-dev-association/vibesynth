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
  'ex-landing': 'A desktop landing page for "LifeFlow" — an AI life pattern tracking service. Hero section with headline "당신의 하루를 이해하는 AI, LifeFlow", subheading about sleep/exercise/meal/emotion tracking with AI coaching, two CTA buttons ("무료로 시작하기" primary, "데모 보기" secondary), floating app mockup visual, social proof "50,000+ 사용자" with 4.9 star rating. Features section: 6 cards in 2x3 grid (Smart Pattern Recognition, AI Coaching, Mood Tracking, Weekly Reports, Goal System, Privacy). Pricing table with 3 tiers (Free ₩0, Plus ₩4,900/mo, Premium ₩9,900/mo). Dark footer with newsletter signup, social links, legal. Use a gradient blue-to-purple hero, clean white feature section, modern sans-serif typography. Sticky navigation with logo, features, pricing, about links, and sign up button.',
  'ex-homepage': 'A corporate homepage for "LifeFlow Inc.", the company behind the LifeFlow AI life pattern tracking app. Screen 1 (Home): Navigation with logo, About, Team, Blog, Careers, Contact, "Try LifeFlow" CTA. Hero "AI로 더 나은 내일을 설계하다" with mission text. Numbers section (50K+ users, 10M+ patterns, 87% achievement rate, 30+ partners). Press logos row (TechCrunch, Forbes, Wired). 3 latest blog post cards. Screen 2 (About/Team): Mission statement, company timeline (2023-2026), team grid (CEO, CTO, Head of AI, Head of Design with photos placeholders and bios), company values. Screen 3 (Careers): Remote work culture section, open positions list (Senior AI Engineer, Product Designer, Growth Manager, Data Scientist) with team/location/apply button, employee testimonial. Clean corporate style with white base, navy text, serif headings, generous whitespace.',
  'ex-dashboard': 'A dark-themed admin dashboard for "LifeFlow" member management. Screen 1 (Overview): Sidebar navigation (Overview active, Members, Subscriptions, Analytics, Support, Settings). 4 KPI cards (Total Members 52,847, Active Today 12,394, New This Week 1,283, Churn Rate 2.1%). Line chart for member growth (6 months), donut chart for plan distribution (Free 65%, Plus 25%, Premium 10%), bar chart for daily active users. Recent activity feed. Screen 2 (Member List): Search bar + filter chips (All Plans, Active/Inactive/Suspended). Data table with columns: avatar, name, email, plan badge, status dot, joined date, last active, action buttons. Pagination showing 20 of 52,847. Bulk action buttons. Screen 3 (Member Detail): Profile header with avatar/name/email/dates. Subscription card with plan/billing/payment. Usage stats (habits tracked, AI sessions, streaks). Activity timeline log. Admin action buttons (Change Plan, Message, Suspend, Delete). Dark background (#0f1117), orange (#FF7849) accent, clean data-focused design.',
  'ex-iphone': 'A native iOS mobile app (390px width) for "LifeFlow" — AI life pattern tracking. Screen 1 (Today): Status bar 9:41. Greeting "좋은 아침, 민지님 ☀️" with date. AI Insight card with personalized advice about sleep and caffeine. Today habits checklist (아침 명상 ✓, 물 8잔 5/8, 30분 걷기 ☐, 독서 20분 ☐, 감사 일기 ☐). Streak "🔥 15일 연속". Quick log buttons row (수면, 운동, 식사, 감정). Bottom nav (Today active, Insights, Log, Community, Profile). Screen 2 (Insights): Weekly wellness score ring (78/100). Pattern cards (sleep 7.2h, exercise 4x/week 80%, meals 85/100, energy 7.1/10). AI weekly report card. 4-week trend line graph. Screen 3 (Log Entry): Category tabs (수면/운동/식사/감정/습관). Sleep log with bedtime/wake scroll pickers, 5-level emoji quality rating, memo text input. Quick tags (#카페인 #운동 #스트레스). Warm mint/green palette, white background, soft card shadows, rounded corners 16px, iOS-style design.',
  'ex-android': 'A Material Design 3 Android app (390px width) for "LifeFlow" — AI life pattern tracking. Screen 1 (Home): Top app bar "LifeFlow" + avatar + notification bell. Today card with "안녕하세요, 준혁님" greeting + AI insight about walking goal. Habit grid 2x3 (아침 명상 ✓, 물 마시기 6/8, 운동 30분 ☐, 독서 ☐, 감사 일기 ☐, 비타민 ✓). Stats row (12일 연속 🔥, 주간 72%, 이번 달 A-). FAB (+) for quick add. Bottom navigation (Home active, Insights, Record, Social, Settings). Screen 2 (AI Coach Chat): Chat bubbles — AI asks about sleep patterns, user asks "요즘 새벽에 자꾸 깨는데 왜 그럴까?", AI analyzes caffeine intake and exercise patterns with action plan card. Text input bar + mic + quick question chips. Screen 3 (Progress & Goals): Swipeable goal cards (30일 명상 67%, 주 5회 운동 3/5, 물 2L 1.5/2). Achievement badges horizontal scroll (7일 연속, 첫 AI 상담, 운동 마스터, 독서왕). Monthly calendar heatmap (GitHub-style). AI prediction card. Warm orange/coral palette, Material Design 3 elevation, rounded cards 12px.',
  'ex-ipad': 'A tablet app (1024px portrait) for "LifeFlow" — AI life pattern tracking on iPad. Screen 1 (Dashboard Split View): Left pane 40% — greeting + AI insight card, today habits checklist (8 items), streak 🔥18일. Right pane 60% — weekly wellness ring (82/100), habit completion bar chart (horizontal), sleep/exercise/meal trend line charts (4 weeks), emotion calendar with emoji heatmap. Top bar with logo, date navigator, profile, notifications, settings. Screen 2 (Journal): Date header "2026년 4월 4일 토요일". Mood selector (5 emoji levels). Large text journal area. Today summary card (수면 7h, 운동 ✓, 물 2L). Sketch area placeholder for Apple Pencil. AI reflection card. Tags (#감사 #목표달성 #피로). Photo attachment area. Screen 3 (Family Hub): Family member profile cards horizontal scroll (민지 82점, 준혁 75점, 하은 90점, 엄마 68점). Selected member detail with family comparison chart, individual habit progress, AI family insight. Shared goals section. Calm lavender/purple palette, iPadOS-style sidebar, generous whitespace, large typography, card-based hierarchy.',
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
