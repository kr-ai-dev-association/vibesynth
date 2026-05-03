export const enExampleNames = {
  'ex-landing': 'LifeFlow Landing Page',
  'ex-homepage': 'LifeFlow Inc. Homepage',
  'ex-dashboard': 'LifeFlow Admin Dashboard',
  'ex-iphone': 'LifeFlow iPhone App',
  'ex-android': 'LifeFlow Android App',
  'ex-ipad': 'LifeFlow iPad App',
}

export const enCategoryLabels: Record<string, string> = {
  landing: 'Landing Page',
  homepage: 'Homepage',
  dashboard: 'Dashboard',
  iphone: 'iPhone App',
  android: 'Android App',
  ipad: 'iPad App',
}

export const enSuggestions = [
  'A recipe discovery app for making cocktails at home with step-by-step guides',
  'A browse tab for a mobile app for romantic travel destinations',
  'Mobile home screen for a fitness tracking app with dark theme',
]

export const enPrds: Record<string, string> = {
  'ex-landing': `# LifeFlow — Service Landing Page

## Overview
The introductory landing page for LifeFlow. As the first touchpoint for potential customers, it communicates the core value of the service within 30 seconds and drives sign-up/download conversions.

## Target Audience
- Ages 25–45, office workers/freelancers interested in lifestyle improvement
- Early adopters with experience using healthcare/wellness apps
- Users interested in data-driven self-management

## Key Screens (3 sections in single page)

### Hero Section
- **Headline:** "AI That Understands Your Day — LifeFlow"
- **Subheading:** "Track your daily patterns — sleep, exercise, meals, mood — and get personalized AI life coaching"
- **CTA:** "Start Free" (primary), "Watch Demo" (secondary)
- **Visual:** Floating mockup with 3 overlapping app screens
- **Social proof:** "50,000+ users are transforming their lives" + 4.9 star rating

### Features Section
3-column card grid:
1. **Smart Pattern Recognition** — AI automatically analyzes sleep, exercise, and meal patterns
2. **Personalized AI Coaching** — Delivers custom advice every morning
3. **Mood & Energy Tracking** — Visualizes mood/energy changes to discover triggers
4. **Weekly Insight Report** — View weekly progress at a glance
5. **Goal Achievement System** — Set goals → break into milestones → track achievement
6. **Privacy First** — Data encryption, on-device processing, GDPR compliant

### Pricing Section
| Plan | Price | Includes |
|------|-------|----------|
| Free | $0 | 3 habits, basic AI advice, 7-day history |
| Plus | $4.99/mo | Unlimited habits, advanced AI coaching, unlimited history, weekly reports |
| Premium | $9.99/mo | Plus + expert consultation, family sharing (5), API access |

### Footer
- Company info, service links, social media, newsletter signup, legal notices

## Design Direction
- Full-width responsive layout (1280px desktop)
- Hero: bright gradient background + app mockup
- Font: clean sans-serif (Inter/Pretendard)
- Color: trustworthy blue/purple tones + bright accents
- Professional yet friendly tone
`,

  'ex-homepage': `# LifeFlow Inc. — Company Homepage

## Overview
The official homepage of the company behind LifeFlow. Provides corporate information including the company's vision, team, product lineup, careers, blog, partnerships, and builds trust with B2B audiences such as investors, partners, and press.

## Target Audience
- General users interested in the service (→ linked to landing page)
- Investors, partner companies, media contacts
- HR / Operations leads evaluating corporate wellness solutions
- Job applicants

## Key Pages (4 pages)

### Page 1: Home
- **Navigation:** Logo, About, Service, Careers, Blog, Contact, "Try LifeFlow" CTA
- **Hero:** "Designing a Better Tomorrow with AI" + company mission subtext
- **Numbers:** 50K+ Users, 10M+ Patterns Analyzed, 87% Avg. Achievement Rate, 30+ Partners
- **Featured In:** TechCrunch, Forbes, Wired logos
- **Product Preview:** Personal / Family / Enterprise three cards → linked to "Service & Products"
- **Latest Blog Posts:** 3 cards (AI Technology, Wellness Trends, User Stories)

### Page 2: About / Team
- **Mission Statement:** "Everyone should be able to understand and improve their life through data"
- **Timeline:** 2023 Founded → 2024 Seed Funding → 2025 50K Users → 2026 Series A
- **Team Grid:** CEO, CTO, Head of AI, Head of Design (name, role, previous experience)
- **Values:** Innovation, Privacy, Empathy, Science-Driven
- **Advisory Board:** 4 advisors from medicine / psychology / AI

### Page 3: Service & Products
- **Intro:** "Pick the LifeFlow that fits your life stage"
- **Product Lineup (3 cards):**
  1. **LifeFlow Personal** — core app for individuals (iOS/Android), Free + Plus + Premium tiers
  2. **LifeFlow Family** — family hub for up to 5 members (includes iPad family mode), $14.99/mo
  3. **LifeFlow Enterprise** — employee wellness program + admin dashboard + SSO/SCIM, contact sales
- **Feature Comparison Table:** product × feature matrix (AI coaching, family sharing, admin console, API access, dedicated CSM, etc.)
- **Integrations:** Apple Health, Google Fit, Garmin, Fitbit, Slack, Microsoft Teams logo grid
- **B2B Case Study:** "Company A rolled out to 5,000 employees, reduced sick-day rate by 18% in 6 months" + 6 customer logos
- **CTA:** "Start Personal Free" / "Try Family 14 days" / "Request Enterprise Demo"

### Page 4: Careers
- **Culture Section:** Remote work, flexible hours, learning stipend, health support
- **Open Positions:** Senior AI Engineer, Product Designer, Growth Manager, Data Scientist, Enterprise Account Executive
- Each position: title, team, location (Remote/Seoul), experience, "Apply" button
- **Employee Testimonial:** "Working at LifeFlow has improved my own life patterns too" — AI Team Lead
- **Hiring Process:** Application → 1st interview → take-home → culture fit → offer (typically 2–3 weeks)

## Design Direction
- Clean and professional corporate site
- Navigation: sticky header + generous whitespace
- White base + deep navy/blue text
- Premium typography (Serif headline + Sans body)
- Large image placeholders (team photos, office, product mockups)
- Service page leans on cards + comparison table — confident B2B tone
`,

  'ex-dashboard': `# LifeFlow Admin — Member Management Dashboard

## Overview
An admin dashboard used by the LifeFlow operations team. Provides member management, subscription status, user activity analytics, and system monitoring.

## Target Audience
- LifeFlow operations team (CS, Marketing, Product)
- Administrators (Admin, Super Admin)

## Key Screens (3 screens)

### Screen 1: Overview Dashboard
- **KPI Cards (4):** Total Members (52,847), Active Today (12,394), New This Week (1,283), Churn Rate (2.1%)
- **Charts:**
  - Member growth trend (last 6 months, line chart)
  - Subscription plan distribution (Free 65%, Plus 25%, Premium 10%, donut chart)
  - Daily active users (bar chart)
- **Recent Activity Feed:** Recent signup/subscription change/inquiry event timeline
- **Sidebar Navigation:** Overview, Members, Subscriptions, Analytics, Support, Settings

### Screen 2: Member List
- **Search + Filters:** Name/email search, plan filter (Free/Plus/Premium), status filter (Active/Inactive/Suspended)
- **Table Columns:** Avatar, Name, Email, Plan (badge), Status (dot), Joined, Last Active, Actions (view/edit/suspend)
- **Pagination:** 20 per page, 52,847 total
- **Bulk Actions:** Export CSV, Send Notification, Change Plan

### Screen 3: Member Detail
- **Profile Header:** Avatar, name, email, join date, last access
- **Subscription Info:** Current Plan (Plus), Billing Cycle, Next Payment, Payment Method
- **Usage Stats:** Habits tracked, AI advice sessions, streak record, weekly active days
- **Activity Timeline:** Recent activity log (habit records, AI consultations, settings changes)
- **Admin Actions:** Change Plan, Send Message, Reset Password, Suspend Account, Delete Account

## Design Direction
- Desktop-only (1280px+), sidebar navigation
- Dark mode default (admin dashboard style)
- Data-centric: clean tables, charts, KPI cards
- Color: dark background + orange/blue accents
- Font: high-readability mono/sans-serif combination
`,

  'ex-iphone': `# LifeFlow — iPhone App

## Overview
LifeFlow's core mobile app (iOS). The main interface where users record daily life patterns, receive personalized AI advice, track progress, and review their long-term achievements at a glance.

## Target Audience
- iOS users (iPhone 12+)
- Ages 25–45, office workers interested in self-care/wellness
- Busy users who prefer 3–5 minutes of daily app usage

## Key Screens (4 screens)

### Screen 1: Today (Home)
- **Status Bar:** 9:41, signal/wifi/battery
- **Greeting:** "Good morning, Minji ☀️" + today's date
- **AI Insight Card:** "Your sleep was 1 hour shorter than usual last night. How about only having caffeine before 2 PM today?" — AI Coach
- **Today's Habits:** Checklist format
  - ☑ Morning meditation 10 min (done)
  - ☐ Drink 8 glasses of water (5/8)
  - ☐ Walk 30 minutes
  - ☐ Read 20 minutes
  - ☐ Write gratitude journal
- **Streak Counter:** "🔥 15-day streak!"
- **Quick Log Buttons:** Sleep | Exercise | Meals | Mood
- **Bottom Nav:** Today (active), Insights, Log, Profile

### Screen 2: Insights
- **Weekly Score Ring:** Overall wellness score (78/100), color-coded
- **Pattern Cards:**
  - Sleep: Avg 7.2h, +0.5h vs last week ↑
  - Exercise: 4x/week, 80% goal achievement
  - Meals: Regularity score 85/100
  - Mood: Avg energy level 7.1/10
- **AI Weekly Report:** "This Week's Highlights" card — 3 key insights summarized
- **Trend Graph:** 4-week wellness score change (line graph)

### Screen 3: Log Entry
- **Category Picker:** Sleep | Exercise | Meals | Mood | Habits (tabs)
- **Sleep Log Example:**
  - Bedtime (scroll picker): 11:30 PM
  - Wake time: 7:00 AM
  - Sleep quality: 😴😐😊😃🤩 (5 levels)
  - Notes: free text input
- **Save + AI Response:** Shows AI comment immediately after save
- **Quick Tags:** #caffeine #exercise #stress #goodday

### Screen 4: Profile & Achievements
- **Profile Header:** Avatar, name (Minji), join date (joined Jun 2025), membership badge (Plus)
- **Lifetime Stats (3-column cards):**
  - 142 total logged days
  - Avg wellness score 78
  - Longest streak 🔥 32 days
- **Badge Collection (4×3 grid):**
  - 🌅 Early Bird / 🧘 Meditation Master / 💧 Hydration Champ / 📖 30-Day Reader
  - 🏃 First Run / 😊 Mood Journal / 🥗 7-Day Diet / 🌱 Sprout (signup)
  - Locked badges shown grey with progress bar
- **Connected Devices:** Apple Watch (paired), AirPods, HealthKit sync ON
- **Settings Quick Access:** Notifications, Privacy, Export Data, Subscription, Help
- **Theme:** System / Light / Dark toggle
- **Sign Out / Delete Account** (small text at the bottom)

## Design Direction
- iOS design guidelines (390px viewport)
- Bright, warm colors (mint/green tones + white)
- SF Pro style typography
- Soft card shadows, rounded corners (16px)
- Emotional yet clean interface
`,

  'ex-android': `# LifeFlow — Android App

## Overview
LifeFlow's Android version. Follows Material Design 3 guidelines, providing the same core features as the iPhone version while applying Android-native UI patterns. The 4-screen layout adds a Community space where users join challenges and cheer on friends and coworkers.

## Target Audience
- Android users (Pixel, Samsung Galaxy, etc.)
- Ages 25–45, users interested in lifestyle improvement
- Users who leverage Android-specific features like widgets and notification customization
- Social users who enjoy challenges with friends/coworkers

## Key Screens (4 screens)

### Screen 1: Home (Today)
- **Top App Bar:** "LifeFlow" + profile avatar + notification bell
- **Today Card (Material Elevated):**
  - "Hello, Junhyuk" + date
  - AI insight: "You've hit 60% of today's walking goal! How about finishing with an evening walk? 🚶"
- **Habit Grid (2x3):** Material Design 3 chip/card style
  - Morning meditation ✓ | Water (6/8) | Exercise 30 min ☐
  - Read 20 min ☐ | Gratitude journal ☐ | Vitamins ✓
- **Stats Row:** 12-day streak 🔥 | Weekly rate 72% | Monthly avg A-
- **FAB:** + Quick add record
- **Bottom Navigation Bar:** Home, AI Coach, Progress, Community

### Screen 2: AI Coach Chat
- **Chat Interface:** Conversational interface with AI coach
- **Messages:**
  - AI: "Junhyuk, I've analyzed your sleep patterns this week. Any questions?"
  - User: "I keep waking up at dawn lately. Why might that be?"
  - AI: "Looking at your records, you had caffeine after 9 PM three times. Also, sleep quality was lower on Wednesday when you skipped exercise. Shall we adjust both?"
  - AI: Specific action plan card (checklist format)
- **Input Bar:** Text input + mic (voice input) + quick question chips
- **Quick Questions:** "Weekly summary" | "Sleep analysis" | "Exercise tips" | "Diet tips"

### Screen 3: Progress & Goals
- **Goal Cards (swipeable):**
  - "30-Day Meditation Challenge" — 67% progress (20/30 days)
  - "Exercise 5x/week" — This week 3/5 done
  - "Drink 2L water daily" — Today 1.5L / 2L
- **Achievement Badges:** Recent badges horizontal scroll
  - 🏆 7-Day Streak | ⭐ First AI Session | 💪 Exercise Master | 📖 Bookworm
- **Monthly Calendar Heatmap:** This month's activity intensity (GitHub-style)
- **AI Prediction:** "At your current pace, you're projected to achieve 89% of this month's goals!"

### Screen 4: Community
- **Top Tabs:** Friends | Challenges | Groups
- **Friend Activity Feed (card list):**
  - Jiyoung completed "Morning Run 7-Day Challenge" 🏃‍♀️ — Cheer / Comment
  - Donghyun earned the "Hydration Champ" badge 💧
  - Sumin joined the "30-Day Meditation" challenge 🧘
- **Active Challenges (horizontal card scroll):**
  - "Weekend 10K Steps" — 12 participants / your rank #4 / 2 days left (progress bar)
  - "Sleep before 9pm × 7 days" — 5 participants / 3/7 done
- **Recommended Challenges (2-col grid):**
  - 🌅 21-Day Morning Routine / 💪 4-Week Home Workout / 📚 30-Day Reading / 🥗 7-Day Veggie
  - Each card: participant count, average completion rate, "Join" button
- **Group (card):** "Design Team Wellness" — 8 members, weekly avg score 76, group chat preview
- **Add Friend FAB:** + Search friends / QR invite code
- **Notification Bell Counter:** 3 new cheers, 1 challenge invite

## Design Direction
- Material Design 3 compliant (Dynamic Color)
- 390px viewport (mobile)
- Color: warm orange/coral tones + light surfaces
- Top App Bar + Bottom Navigation Bar pattern
- FAB (Floating Action Button) usage
- Rounded cards (12px), MD3 elevation system
- Community screen leans warm and social — friend avatars and activity cards take the lead
`,

  'ex-ipad': `# LifeFlow — iPad App

## Overview
LifeFlow's dedicated iPad app. Leverages the wide screen for a parallel analytics dashboard and recording interface, supports Apple Pencil for mood journaling/sketching, and uses a full-canvas Insights Report screen to surface long-term trends in depth.

## Target Audience
- iPad Pro / iPad Air users
- Power users who want data visualization on a large screen
- Users who want to keep mood journals with Apple Pencil
- Families who want to manage habits together
- Users who want to export monthly/quarterly PDF reports

## Key Screens (4 screens)

### Screen 1: Dashboard (Split View)
- **Left Pane (40%):** Today's Overview
  - Greeting + AI insight card
  - Today's habit checklist (8 items)
  - Streak: 🔥 18-day streak
- **Right Pane (60%):** Analytics Dashboard
  - Weekly wellness score ring (82/100)
  - Habit completion rate bar graph (horizontal)
  - Sleep/exercise/meal trend line charts (4 weeks)
  - Emotion calendar (emoji heatmap)
- **Top Bar:** LifeFlow logo, date navigator (< Today >), profile, notifications, settings
- **Sidebar:** Dashboard, Journal, Family Hub, Insights Report

### Screen 2: Journal (Full Canvas)
- **Date Header:** "Saturday, April 4, 2026"
- **Mood Selector:** 5-level emotion emojis in horizontal row (selected: 😊)
- **Journal Area:**
  - Text input area (large font, generous padding)
  - Today's record summary card (Sleep 7h, Exercise ✓, Water 2L)
  - Apple Pencil sketch area (free drawing)
- **AI Reflection:** After writing, AI provides emotion pattern analysis + encouragement
- **Tags:** #grateful #goalmet #tired #goodday (tag chips)
- **Photo Attach:** Add today's photos (meals, exercise proof, etc.)

### Screen 3: Family Hub
- **Family Members (Top):** Profile cards horizontal scroll
  - Minji (me) — Score 82, 🔥15 days
  - Junhyuk (partner) — Score 75, 🔥8 days
  - Haeun (daughter) — Score 90, 🔥22 days
  - Mom — Score 68, 🔥3 days
- **Selected Member Detail:**
  - Weekly habit achievement comparison chart (whole family)
  - Individual habit list + progress
  - AI family insight: "Haeun has been consistently maintaining her reading habit this week. Let's celebrate! 🎉"
- **Shared Goals:** Family shared goals (weekend exercise together, family meals 3x/week)

### Screen 4: Insights Report (Full-Canvas Analytics)
- **Top Control Bar:** period picker (This Week / This Month / Quarter / Custom), category filter, "Export PDF" button, "Share" button
- **Summary Header Card:** "April 2026 overall score 81 · +6 vs last month ↑" + one-line AI summary
- **Two-column Grid Layout:**
  - **Left Column:**
    - Monthly trend per category (sleep / exercise / meals / mood — 4 line charts)
    - Time-of-day activity heatmap (weekday × hour — most active windows highlighted)
  - **Right Column:**
    - Correlation cards: "Average sleep score is +14 higher on days you exercised"
    - 5 insights such as "Days with 4+ caffeines → next-day energy −22%"
    - Goal achieved vs missed comparison donut chart
- **AI Synthesis (full-width card):**
  - 3 strengths this month, 2 areas to improve, 3 recommended actions for next month (checkable list)
- **Achievement Timeline (full-width):** Horizontal timeline of badges/milestones earned in the period
- **Footer:** "Report generated 2026-04-30 21:14" + data sources (own logs, Apple Health sync)

## Design Direction
- iPad optimized (1024px portrait viewport)
- Split View / multi-panel layout
- iPadOS design patterns (sidebar, large touch targets)
- Color: calm purple/lavender tones + white
- Generous whitespace, large typography
- Card-based information hierarchy
- Apple Pencil area with subtle paper texture hint
- Insights Report uses a tidy print-friendly grid and a steady chart palette suitable for PDF export
`,
}
