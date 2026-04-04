import type { Project } from '../App'

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

export const EXAMPLE_CATEGORIES: { id: ExampleCategory; label: string; icon: string }[] = [
  { id: 'landing', label: 'Landing Page', icon: '🚀' },
  { id: 'homepage', label: 'Homepage', icon: '🏠' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'iphone', label: 'iPhone App', icon: '📱' },
  { id: 'android', label: 'Android App', icon: '🤖' },
  { id: 'ipad', label: 'iPad App', icon: '📋' },
]

// ─── PRDs ──────────────────────────────────────────────────────

const PRD_LANDING = `# LifeFlow — Service Landing Page

## Overview
LifeFlow의 서비스 소개 랜딩 페이지. 잠재 고객이 처음 접하는 접점으로, 서비스의 핵심 가치를 30초 안에 전달하고 가입/다운로드 전환을 유도한다.

## Target Audience
- 25~45세, 생활 습관 개선에 관심 있는 직장인/프리랜서
- 헬스케어/웰니스 앱을 사용해 본 경험이 있는 얼리 어답터
- 데이터 기반 자기 관리에 흥미를 느끼는 사용자

## Key Screens (3 sections in single page)

### Hero Section
- **Headline:** "당신의 하루를 이해하는 AI, LifeFlow"
- **Subheading:** "수면, 운동, 식사, 감정 — 일상의 모든 패턴을 기록하면 AI가 맞춤형 라이프 코칭을 제공합니다"
- **CTA:** "무료로 시작하기" (primary), "데모 보기" (secondary)
- **Visual:** 앱 화면 3개가 겹쳐진 floating mockup
- **Social proof:** "50,000+ 사용자가 삶을 바꾸고 있습니다" + 별점 4.9

### Features Section
3열 카드 그리드:
1. **Smart Pattern Recognition** — AI가 수면, 운동, 식사 패턴을 자동 분석
2. **Personalized AI Coaching** — 개인 맞춤형 조언을 매일 아침 전달
3. **Mood & Energy Tracking** — 감정/에너지 변화를 시각화하여 트리거 발견
4. **Weekly Insight Report** — 주간 리포트로 진행 상황 한눈에 확인
5. **Goal Achievement System** — 목표 설정 → 마일스톤 분해 → 달성률 추적
6. **Privacy First** — 데이터 암호화, 기기 내 처리 우선, GDPR 준수

### Pricing Section
| Plan | 가격 | 포함 |
|------|------|------|
| Free | ₩0 | 습관 3개, 기본 AI 조언, 7일 히스토리 |
| Plus | ₩4,900/월 | 무제한 습관, 고급 AI 코칭, 무제한 히스토리, 주간 리포트 |
| Premium | ₩9,900/월 | Plus + 전문가 상담 연결, 가족 공유 (5명), API 접근 |

### Footer
- 회사 정보, 서비스 링크, 소셜 미디어, 뉴스레터 구독, 법적 고지

## Design Direction
- Full-width 반응형 레이아웃 (데스크톱 1280px)
- 히어로: 밝은 그라디언트 배경 + 앱 목업
- 폰트: 깔끔한 Sans-serif (Inter/Pretendard)
- 컬러: 신뢰감 있는 블루/퍼플 계열 + 밝은 액센트
- 프로페셔널하면서도 친근한 톤
`

const PRD_HOMEPAGE = `# LifeFlow Inc. — Company Homepage

## Overview
LifeFlow 서비스를 제공하는 회사의 공식 홈페이지. 회사의 비전, 팀, 채용 정보, 블로그, 파트너십 등 기업 정보를 제공하며, 투자자/파트너/언론 등 B2B 대상자에게도 신뢰를 전달한다.

## Target Audience
- 서비스에 관심 있는 일반 사용자 (→ 랜딩 페이지로 연결)
- 투자자, 파트너사, 언론 관계자
- 채용 지원자

## Key Screens (3 screens)

### Screen 1: Home
- **Navigation:** Logo, About, Team, Blog, Careers, Contact, "Try LifeFlow" CTA
- **Hero:** "AI로 더 나은 내일을 설계하다" + 회사 미션 서브텍스트
- **Numbers:** 사용자 50K+, 분석된 패턴 10M+, 평균 습관 달성률 87%, 파트너 기업 30+
- **Featured In:** TechCrunch, Forbes, Wired 로고
- **Latest Blog Posts:** 3개 카드 (AI 기술, 웰니스 트렌드, 사용자 스토리)

### Screen 2: About / Team
- **Mission Statement:** "모든 사람이 데이터로 자신의 삶을 이해하고 개선할 수 있어야 합니다"
- **Timeline:** 2023 창업 → 2024 시드 투자 → 2025 50K 사용자 → 2026 시리즈 A
- **Team Grid:** CEO, CTO, Head of AI, Head of Design (이름, 역할, 이전 경력)
- **Values:** Innovation, Privacy, Empathy, Science-Driven

### Screen 3: Careers
- **Culture Section:** 리모트 워크, 유연 근무, 학습 지원금, 건강 관리 지원
- **Open Positions:** Senior AI Engineer, Product Designer, Growth Manager, Data Scientist
- 각 포지션: 제목, 팀, 위치 (Remote/Seoul), 경력, "Apply" 버튼
- **Employee Testimonial:** "LifeFlow에서 일하며 내 생활 패턴도 좋아졌어요" — AI팀 리드

## Design Direction
- 클린하고 프로페셔널한 기업 사이트
- 네비게이션: 스티키 헤더 + 넉넉한 여백
- 화이트 베이스 + 딥 네이비/블루 텍스트
- 고급스러운 타이포그래피 (Serif headline + Sans body)
- 큰 이미지 플레이스홀더 (팀 사진, 오피스)
`

const PRD_DASHBOARD = `# LifeFlow Admin — Member Management Dashboard

## Overview
LifeFlow 서비스 운영팀이 사용하는 어드민 대시보드. 가입 회원 관리, 구독 현황, 사용자 활동 분석, 시스템 모니터링 등을 제공한다.

## Target Audience
- LifeFlow 운영팀 (CS, 마케팅, 프로덕트)
- 관리자 (Admin, Super Admin)

## Key Screens (3 screens)

### Screen 1: Overview Dashboard
- **KPI Cards (4개):** Total Members (52,847), Active Today (12,394), New This Week (1,283), Churn Rate (2.1%)
- **Charts:**
  - 가입자 증가 추이 (지난 6개월, 라인 차트)
  - 구독 플랜 분포 (Free 65%, Plus 25%, Premium 10%, 도넛 차트)
  - 일별 활성 사용자 (바 차트)
- **Recent Activity Feed:** 최근 가입/구독 변경/문의 이벤트 타임라인
- **Sidebar Navigation:** Overview, Members, Subscriptions, Analytics, Support, Settings

### Screen 2: Member List
- **검색 + 필터:** 이름/이메일 검색, 플랜 필터 (Free/Plus/Premium), 상태 필터 (Active/Inactive/Suspended)
- **테이블 컬럼:** Avatar, Name, Email, Plan (badge), Status (dot), Joined, Last Active, Actions (view/edit/suspend)
- **Pagination:** 페이지당 20명, 총 52,847명
- **Bulk Actions:** Export CSV, Send Notification, Change Plan

### Screen 3: Member Detail
- **Profile Header:** Avatar, 이름, 이메일, 가입일, 마지막 접속
- **Subscription Info:** Current Plan (Plus), Billing Cycle, Next Payment, Payment Method
- **Usage Stats:** 기록된 습관 수, AI 조언 사용 횟수, 스트릭 기록, 주간 활동일
- **Activity Timeline:** 최근 활동 로그 (습관 기록, AI 상담, 설정 변경)
- **Admin Actions:** Change Plan, Send Message, Reset Password, Suspend Account, Delete Account

## Design Direction
- 데스크톱 전용 (1280px+), 사이드바 내비게이션
- 다크 모드 기본 (어드민 대시보드 특성)
- 데이터 중심: 깔끔한 테이블, 차트, KPI 카드
- 색상: 다크 배경 + 오렌지/블루 액센트
- 폰트: 가독성 높은 모노/산세리프 조합
`

const PRD_IPHONE = `# LifeFlow — iPhone App

## Overview
LifeFlow의 핵심 모바일 앱 (iOS). 사용자가 매일 생활 패턴을 기록하고, AI의 맞춤형 조언을 받고, 진행 상황을 추적하는 메인 인터페이스.

## Target Audience
- iOS 사용자 (iPhone 12+)
- 25~45세, 자기 관리/웰니스에 관심 있는 직장인
- 매일 3~5분 정도 앱 사용을 선호하는 바쁜 사용자

## Key Screens (3 screens)

### Screen 1: Today (Home)
- **Status Bar:** 9:41, signal/wifi/battery
- **Greeting:** "좋은 아침, 민지님 ☀️" + 오늘 날짜
- **AI Insight Card:** "어제 수면 시간이 평소보다 1시간 짧았어요. 오늘은 카페인을 오후 2시 전에만 드시는 건 어때요?" — AI Coach
- **Today's Habits:** 체크리스트 형태
  - ☑ 아침 명상 10분 (완료)
  - ☐ 물 8잔 마시기 (5/8)
  - ☐ 30분 걷기
  - ☐ 독서 20분
  - ☐ 감사 일기 쓰기
- **Streak Counter:** "🔥 15일 연속 달성 중!"
- **Quick Log Buttons:** 수면 | 운동 | 식사 | 감정
- **Bottom Nav:** Today (active), Insights, Log, Community, Profile

### Screen 2: Insights
- **Weekly Score Ring:** 종합 웰니스 점수 (78/100), 색상 코딩
- **Pattern Cards:**
  - 수면: 평균 7.2시간, 지난주 대비 +0.5h ↑
  - 운동: 주 4회, 목표 달성률 80%
  - 식사: 규칙성 점수 85/100
  - 감정: 평균 에너지 레벨 7.1/10
- **AI Weekly Report:** "이번 주 하이라이트" 카드 — 핵심 인사이트 3개 요약
- **Trend Graph:** 지난 4주 웰니스 점수 변화 (라인 그래프)

### Screen 3: Log Entry
- **Category Picker:** 수면 | 운동 | 식사 | 감정 | 습관 (탭)
- **Sleep Log Example:**
  - 취침 시간 (스크롤 피커): 11:30 PM
  - 기상 시간: 7:00 AM
  - 수면 품질: 😴😐😊😃🤩 (5단계 이모지)
  - 메모: 자유 텍스트 입력
- **Save + AI Response:** 저장하면 즉시 AI 코멘트 표시
- **Quick Tags:** #카페인 #운동 #스트레스 #좋은하루

## Design Direction
- iOS 디자인 가이드라인 준수 (390px viewport)
- 밝고 따뜻한 색상 (민트/그린 계열 + 화이트)
- SF Pro 스타일 타이포그래피
- 부드러운 카드 그림자, 둥근 모서리 (16px)
- 감성적이면서 깔끔한 인터페이스
`

const PRD_ANDROID = `# LifeFlow — Android App

## Overview
LifeFlow의 Android 버전. Material Design 3 가이드라인을 따르며, iPhone 버전과 동일한 핵심 기능을 제공하되 Android 고유의 UI 패턴을 적용한다.

## Target Audience
- Android 사용자 (Pixel, Samsung Galaxy 등)
- 25~45세, 생활 패턴 개선에 관심 있는 사용자
- 위젯, 알림 커스터마이징 등 Android 고유 기능을 활용하는 사용자

## Key Screens (3 screens)

### Screen 1: Home (Today)
- **Top App Bar:** "LifeFlow" + 프로필 아바타 + 알림 벨
- **Today Card (Material Elevated):**
  - "안녕하세요, 준혁님" + 날짜
  - AI 인사이트: "오늘 걷기 목표의 60%를 달성했어요! 저녁 산책으로 마무리해 보세요 🚶"
- **Habit Grid (2x3):** Material Design 3 칩/카드 스타일
  - 아침 명상 ✓ | 물 마시기 (6/8) | 운동 30분 ☐
  - 독서 20분 ☐ | 감사 일기 ☐ | 비타민 복용 ✓
- **Stats Row:** 연속 12일 🔥 | 주간 달성률 72% | 이번 달 평균 A-
- **FAB:** + 빠른 기록 추가
- **Bottom Navigation Bar:** Home, Insights, Record, Social, Settings

### Screen 2: AI Coach Chat
- **Chat Interface:** AI 코치와의 대화형 인터페이스
- **Messages:**
  - AI: "준혁님, 이번 주 수면 패턴을 분석했어요. 궁금한 점 있으세요?"
  - User: "요즘 새벽에 자꾸 깨는데 왜 그럴까?"
  - AI: "기록을 보면 저녁 9시 이후 카페인 섭취가 3번 있었어요. 또한 수요일에 운동을 건너뛴 날에 수면 품질이 낮았습니다. 두 가지를 조정해 볼까요?"
  - AI: 구체적 액션 플랜 카드 (체크리스트 형태)
- **Input Bar:** 텍스트 입력 + 마이크 (음성 입력) + 퀵 질문 칩
- **Quick Questions:** "이번 주 요약" | "수면 분석" | "운동 추천" | "식단 팁"

### Screen 3: Progress & Goals
- **Goal Cards (스와이프 가능):**
  - "30일 명상 챌린지" — 진행률 67% (20/30일)
  - "주 5회 운동" — 이번 주 3/5 완료
  - "매일 물 2L" — 오늘 1.5L / 2L
- **Achievement Badges:** 최근 획득 배지 가로 스크롤
  - 🏆 7일 연속 | ⭐ 첫 AI 상담 | 💪 운동 마스터 | 📖 독서왕
- **Monthly Calendar Heatmap:** 이번 달 활동 강도 (깃허브 스타일)
- **AI Prediction:** "현재 페이스라면 이번 달 목표 달성률 89%로 예상됩니다!"

## Design Direction
- Material Design 3 준수 (Dynamic Color 활용)
- 390px viewport (모바일)
- 컬러: 따뜻한 오렌지/코랄 계열 + 밝은 서피스
- Top App Bar + Bottom Navigation Bar 패턴
- FAB (Floating Action Button) 활용
- 둥근 카드 (12px), MD3 elevation 시스템
`

const PRD_IPAD = `# LifeFlow — iPad App

## Overview
LifeFlow의 iPad 전용 앱. 넓은 화면을 활용하여 분석 대시보드와 기록 인터페이스를 병렬로 배치하며, Apple Pencil 지원으로 감정 일기/스케치 기능을 제공한다.

## Target Audience
- iPad Pro / iPad Air 사용자
- 데이터 시각화를 큰 화면으로 보고 싶은 파워 유저
- Apple Pencil로 감정 일기를 쓰고 싶은 사용자
- 가정에서 가족 구성원들의 습관을 함께 관리하려는 사용자

## Key Screens (3 screens)

### Screen 1: Dashboard (Split View)
- **Left Pane (40%):** Today's Overview
  - 인사말 + AI 인사이트 카드
  - 오늘의 습관 체크리스트 (8개 항목)
  - 스트릭: 🔥 18일 연속
- **Right Pane (60%):** Analytics Dashboard
  - 주간 웰니스 점수 Ring (82/100)
  - 습관별 완료율 막대 그래프 (가로)
  - 수면/운동/식사 트렌드 라인 차트 (4주)
  - 감정 달력 (이모지 히트맵)
- **Top Bar:** LifeFlow 로고, 날짜 네비게이터 (< Today >), 프로필, 알림, 설정

### Screen 2: Journal (Full Canvas)
- **Date Header:** "2026년 4월 4일 토요일"
- **Mood Selector:** 5단계 감정 이모지 가로 배열 (선택: 😊)
- **Journal Area:** 
  - 텍스트 입력 영역 (큰 폰트, 넉넉한 여백)
  - 오늘의 기록 요약 카드 (수면 7h, 운동 ✓, 물 2L)
  - Apple Pencil 스케치 영역 (자유 드로잉)
- **AI Reflection:** 작성 후 AI가 감정 패턴 분석 + 격려 메시지
- **Tags:** #감사 #목표달성 #피로 #좋은날 (태그 칩)
- **Photo Attach:** 오늘의 사진 추가 (식단, 운동 인증 등)

### Screen 3: Family Hub
- **Family Members (Top):** 프로필 카드 가로 스크롤
  - 민지 (나) — 점수 82, 🔥15일
  - 준혁 (파트너) — 점수 75, 🔥8일
  - 하은 (딸) — 점수 90, 🔥22일
  - 엄마 — 점수 68, 🔥3일
- **Selected Member Detail:**
  - 이번 주 습관 달성률 비교 차트 (가족 전체)
  - 개인 습관 목록 + 진행 상황
  - AI 가족 인사이트: "하은이가 이번 주 독서 습관을 꾸준히 유지하고 있어요. 함께 축하해 주세요! 🎉"
- **Shared Goals:** 가족 공동 목표 (주말 함께 운동, 가족 식사 주 3회)

## Design Direction
- iPad 최적화 (1024px portrait viewport)
- Split View / 다중 패널 레이아웃 적극 활용
- iPadOS 디자인 패턴 (사이드바, 큰 터치 타겟)
- 컬러: 차분한 퍼플/라벤더 계열 + 화이트
- 넉넉한 여백, 큰 타이포그래피
- 카드 기반 정보 계층 구조
- Apple Pencil 영역은 가벼운 종이 텍스처 힌트
`

// ─── Example Definitions ───────────────────────────────────────

export const EXAMPLE_PROJECTS: ExampleProject[] = [
  {
    project: {
      id: 'ex-landing',
      name: 'LifeFlow Landing Page',
      prompt: 'A desktop landing page for "LifeFlow" — an AI life pattern tracking service. Hero section with headline "당신의 하루를 이해하는 AI, LifeFlow", subheading about sleep/exercise/meal/emotion tracking with AI coaching, two CTA buttons ("무료로 시작하기" primary, "데모 보기" secondary), floating app mockup visual, social proof "50,000+ 사용자" with 4.9 star rating. Features section: 6 cards in 2x3 grid (Smart Pattern Recognition, AI Coaching, Mood Tracking, Weekly Reports, Goal System, Privacy). Pricing table with 3 tiers (Free ₩0, Plus ₩4,900/mo, Premium ₩9,900/mo). Dark footer with newsletter signup, social links, legal. Use a gradient blue-to-purple hero, clean white feature section, modern sans-serif typography. Sticky navigation with logo, features, pricing, about links, and sign up button.',
      updatedAt: new Date().toLocaleDateString(),
      screens: [],
      deviceType: 'web',
    },
    category: 'landing',
    categoryLabel: 'Landing Page',
    emoji: '🚀',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    recommendedDesignId: 'pin-gradient-cards',
    prd: PRD_LANDING,
  },
  {
    project: {
      id: 'ex-homepage',
      name: 'LifeFlow Inc. Homepage',
      prompt: 'A corporate homepage for "LifeFlow Inc.", the company behind the LifeFlow AI life pattern tracking app. Screen 1 (Home): Navigation with logo, About, Team, Blog, Careers, Contact, "Try LifeFlow" CTA. Hero "AI로 더 나은 내일을 설계하다" with mission text. Numbers section (50K+ users, 10M+ patterns, 87% achievement rate, 30+ partners). Press logos row (TechCrunch, Forbes, Wired). 3 latest blog post cards. Screen 2 (About/Team): Mission statement, company timeline (2023-2026), team grid (CEO, CTO, Head of AI, Head of Design with photos placeholders and bios), company values. Screen 3 (Careers): Remote work culture section, open positions list (Senior AI Engineer, Product Designer, Growth Manager, Data Scientist) with team/location/apply button, employee testimonial. Clean corporate style with white base, navy text, serif headings, generous whitespace.',
      updatedAt: new Date().toLocaleDateString(),
      screens: [],
      deviceType: 'web',
    },
    category: 'homepage',
    categoryLabel: 'Homepage',
    emoji: '🏠',
    gradient: 'linear-gradient(135deg, #1a365d 0%, #2a4a7f 50%, #e2e8f0 100%)',
    recommendedDesignId: 'pin-blue-dashboard',
    prd: PRD_HOMEPAGE,
  },
  {
    project: {
      id: 'ex-dashboard',
      name: 'LifeFlow Admin Dashboard',
      prompt: 'A dark-themed admin dashboard for "LifeFlow" member management. Screen 1 (Overview): Sidebar navigation (Overview active, Members, Subscriptions, Analytics, Support, Settings). 4 KPI cards (Total Members 52,847, Active Today 12,394, New This Week 1,283, Churn Rate 2.1%). Line chart for member growth (6 months), donut chart for plan distribution (Free 65%, Plus 25%, Premium 10%), bar chart for daily active users. Recent activity feed. Screen 2 (Member List): Search bar + filter chips (All Plans, Active/Inactive/Suspended). Data table with columns: avatar, name, email, plan badge, status dot, joined date, last active, action buttons. Pagination showing 20 of 52,847. Bulk action buttons. Screen 3 (Member Detail): Profile header with avatar/name/email/dates. Subscription card with plan/billing/payment. Usage stats (habits tracked, AI sessions, streaks). Activity timeline log. Admin action buttons (Change Plan, Message, Suspend, Delete). Dark background (#0f1117), orange (#FF7849) accent, clean data-focused design.',
      updatedAt: new Date().toLocaleDateString(),
      screens: [],
      deviceType: 'web',
    },
    category: 'dashboard',
    categoryLabel: 'Dashboard',
    emoji: '📊',
    gradient: 'linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #FF7849 100%)',
    recommendedDesignId: 'pin-finance-dashboard',
    prd: PRD_DASHBOARD,
  },
  {
    project: {
      id: 'ex-iphone',
      name: 'LifeFlow iPhone App',
      prompt: 'A native iOS mobile app (390px width) for "LifeFlow" — AI life pattern tracking. Screen 1 (Today): Status bar 9:41. Greeting "좋은 아침, 민지님 ☀️" with date. AI Insight card with personalized advice about sleep and caffeine. Today habits checklist (아침 명상 ✓, 물 8잔 5/8, 30분 걷기 ☐, 독서 20분 ☐, 감사 일기 ☐). Streak "🔥 15일 연속". Quick log buttons row (수면, 운동, 식사, 감정). Bottom nav (Today active, Insights, Log, Community, Profile). Screen 2 (Insights): Weekly wellness score ring (78/100). Pattern cards (sleep 7.2h, exercise 4x/week 80%, meals 85/100, energy 7.1/10). AI weekly report card. 4-week trend line graph. Screen 3 (Log Entry): Category tabs (수면/운동/식사/감정/습관). Sleep log with bedtime/wake scroll pickers, 5-level emoji quality rating, memo text input. Quick tags (#카페인 #운동 #스트레스). Warm mint/green palette, white background, soft card shadows, rounded corners 16px, iOS-style design.',
      updatedAt: new Date().toLocaleDateString(),
      screens: [],
      deviceType: 'app',
    },
    category: 'iphone',
    categoryLabel: 'iPhone App',
    emoji: '📱',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    recommendedDesignId: 'pin-mint-dashboard',
    prd: PRD_IPHONE,
  },
  {
    project: {
      id: 'ex-android',
      name: 'LifeFlow Android App',
      prompt: 'A Material Design 3 Android app (390px width) for "LifeFlow" — AI life pattern tracking. Screen 1 (Home): Top app bar "LifeFlow" + avatar + notification bell. Today card with "안녕하세요, 준혁님" greeting + AI insight about walking goal. Habit grid 2x3 (아침 명상 ✓, 물 마시기 6/8, 운동 30분 ☐, 독서 ☐, 감사 일기 ☐, 비타민 ✓). Stats row (12일 연속 🔥, 주간 72%, 이번 달 A-). FAB (+) for quick add. Bottom navigation (Home active, Insights, Record, Social, Settings). Screen 2 (AI Coach Chat): Chat bubbles — AI asks about sleep patterns, user asks "요즘 새벽에 자꾸 깨는데 왜 그럴까?", AI analyzes caffeine intake and exercise patterns with action plan card. Text input bar + mic + quick question chips. Screen 3 (Progress & Goals): Swipeable goal cards (30일 명상 67%, 주 5회 운동 3/5, 물 2L 1.5/2). Achievement badges horizontal scroll (7일 연속, 첫 AI 상담, 운동 마스터, 독서왕). Monthly calendar heatmap (GitHub-style). AI prediction card. Warm orange/coral palette, Material Design 3 elevation, rounded cards 12px.',
      updatedAt: new Date().toLocaleDateString(),
      screens: [],
      deviceType: 'app',
    },
    category: 'android',
    categoryLabel: 'Android App',
    emoji: '🤖',
    gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
    recommendedDesignId: 'pin-orange-crm',
    prd: PRD_ANDROID,
  },
  {
    project: {
      id: 'ex-ipad',
      name: 'LifeFlow iPad App',
      prompt: 'A tablet app (1024px portrait) for "LifeFlow" — AI life pattern tracking on iPad. Screen 1 (Dashboard Split View): Left pane 40% — greeting + AI insight card, today habits checklist (8 items), streak 🔥18일. Right pane 60% — weekly wellness ring (82/100), habit completion bar chart (horizontal), sleep/exercise/meal trend line charts (4 weeks), emotion calendar with emoji heatmap. Top bar with logo, date navigator, profile, notifications, settings. Screen 2 (Journal): Date header "2026년 4월 4일 토요일". Mood selector (5 emoji levels). Large text journal area. Today summary card (수면 7h, 운동 ✓, 물 2L). Sketch area placeholder for Apple Pencil. AI reflection card. Tags (#감사 #목표달성 #피로). Photo attachment area. Screen 3 (Family Hub): Family member profile cards horizontal scroll (민지 82점, 준혁 75점, 하은 90점, 엄마 68점). Selected member detail with family comparison chart, individual habit progress, AI family insight. Shared goals section. Calm lavender/purple palette, iPadOS-style sidebar, generous whitespace, large typography, card-based hierarchy.',
      updatedAt: new Date().toLocaleDateString(),
      screens: [],
      deviceType: 'tablet',
    },
    category: 'ipad',
    categoryLabel: 'iPad App',
    emoji: '📋',
    gradient: 'linear-gradient(135deg, #c3cfe2 0%, #a18cd1 50%, #fbc2eb 100%)',
    recommendedDesignId: 'pin-purple-analytics',
    prd: PRD_IPAD,
  },
]
