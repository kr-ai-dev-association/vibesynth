# PRD: VibeSynth - AI Design-to-Live-App Platform

## 1. Product Overview

**Product Name:** VibeSynth
**Platform:** Electron (Desktop App, macOS/Windows/Linux)
**Core Concept:** AI로 디자인하면 로컬 dev server에서 실제 앱이 즉시 구동된다

Stitch가 "프롬프트 → 정적 디자인 이미지"라면,
VibeSynth는 **"프롬프트 → 실제 구동되는 애플리케이션"**이다.

디자인 변경 시 로컬 dev server가 HMR(Hot Module Replacement)로 즉시 반영하여,
사용자는 캔버스에서 디자인을 수정하는 동시에 실제 앱이 실시간으로 변하는 것을 본다.

---

## 2. Stitch vs VibeSynth: 핵심 차이

| | Stitch | VibeSynth |
|---|--------|-----------|
| **플랫폼** | 웹 (SaaS) | Electron (로컬 데스크톱) |
| **출력물** | 정적 HTML 이미지/프리뷰 | 실제 구동되는 앱 (로컬 서버) |
| **디자인 반영** | Export 후 수동 적용 | HMR로 즉시 반영 |
| **Figma/코드 Export** | 핵심 기능 | **없음** (필요 없음 - 이미 구동 중) |
| **Preview** | 별도 프리뷰 모드 | **없음** (항상 라이브) |
| **Docs** | 별도 문서 페이지 | **없음** (앱 내 통합) |
| **디자인 시스템** | 동일 | **100% 동일한 방식** |
| **디자인 가이드** | 없음 | **AI 생성 + 사용자 편집 가능** |
| **서버** | Google Cloud | 로컬 dev server |

---

## 3. Architecture: Electron + Local Dev Server

```
┌─────────────────────────────────┐    ┌─────────────────────────┐
│      Electron Main Window       │    │   Live App Window       │
│      (Design Canvas)            │    │   (별도 팝업 창)          │
│                                 │    │                         │
│  - 캔버스 편집                    │    │  BrowserView/           │
│  - 프롬프트 입력                  │◄──►  WebContents            │
│  - 디자인 시스템                  │    │  localhost:PORT          │
│  - Agent Log                    │    │                         │
│                                 │    │  Device frame 선택       │
│                                 │    │  DevTools 토글           │
└────────────┬────────────────────┘    └────────────▲────────────┘
             │                                      │
             ▼                                      │
┌─────────────────────────────────────────────────────┐
│              Local Dev Server                        │
│              (Vite / Next.js / etc.)                  │
│                                                      │
│  - 파일 시스템에 코드 생성/수정                         │
│  - HMR로 변경사항 즉시 반영                            │
│  - 프로젝트 폴더 = 실제 앱 코드                        │
└──────────────────────────────────────────────────────┘
```

### 3.1 워크플로우

```
1. 사용자가 프롬프트 입력
   "A fitness tracking dashboard with dark theme and green accents"

2. AI가 디자인 가이드를 참조하여 HTML+CSS 디자인 생성
   → 디자인 시스템 + 디자인 가이드 자동 추출

3. Live App 팝업 창에서 실시간 프리뷰 구동
   → 디자인 변경 시 HMR로 <100ms 반영
   → 별도 창이므로 다른 모니터/위치에 자유롭게 배치 가능
```

### 3.2 Window Layout (메인 + 팝업)

**Main Window (Design Canvas) - 전체 화면 활용:**
```
┌──────────────────────────────────────────────────────────────────┐
│  ☰ VibeSynth    [프로젝트명]  [Generating...]  [▶ Run] [🎨] [⚙]  │
├──────┬───────────────────────────────────────────────┬───────────┤
│      │                                               │ ┌───────┐│
│ 도구  │   Design Canvas (드래그로 패닝)                 │ │Design ││
│      │                                               │ │Compo- ││
│ [↖]  │   ┌──────────────┐  ┌──────────────┐         │ │nents  ││
│ [□]  │   │   Screen 1   │  │   Screen 2   │         │ │Layers ││
│ [✏️]  │   │              │  │              │         │ │       ││
│ [🎤]  │   │              │  │              │         │ │Colors ││
│ [🖼]  │   └──────────────┘  └──────────────┘         │ │Typo   ││
│      │                                               │ │Guide  ││
│      │                                               │ └───────┘│
├──────┴───────────────────────────────────────────────┴───────────┤
│ [+] [📎] What would you like to change?  [App|Tablet|Web] [🎤] [↑]│
├──────────────────────────────────────────────────────────────────┤
│ ✦ Agent log ∨                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Live App Window (별도 팝업 창):**
```
┌─────────────────────────────────────┐
│ Live App   [📱][📱][💻]  [🔧] [✕]    │
│ localhost:5173/dashboard   Running ● │
├─────────────────────────────────────┤
│                                     │
│   실제 구동 중인 앱                   │
│                                     │
│   - 클릭/스크롤/입력 모두 동작        │
│   - 라우팅 동작                      │
│   - 애니메이션 동작                   │
│                                     │
│   디자인 캔버스에서 수정하면           │
│   HMR로 <100ms 내에 여기에 반영      │
│                                     │
├─────────────────────────────────────┤
│ Console  Network  Elements  (토글)  │
└─────────────────────────────────────┘

- 별도 창이므로 듀얼 모니터에서 나란히 배치 가능
- 창 크기 자유 조절 = 반응형 테스트
- Always on top 옵션 제공
- [▶ Run] 버튼 클릭 시 팝업 생성/포커스
```

---

## 4. Core Features

### 4.1 AI Design Generation (Gemini API)

- **텍스트 프롬프트** → Gemini AI가 HTML+CSS 디자인 생성
- **3가지 디바이스 타입:** App (모바일 390px) / Tablet (1024px) / Web (데스크톱 1280px)
- **디자인 가이드 참조:** 기본 가이드(`design_guide.md`) 또는 프로젝트별 커스텀 가이드를 AI 프롬프트에 포함
- **프롬프트 제안 칩:** 클릭하면 바로 생성
- **이미지 첨부:** 참고 디자인 업로드
- **음성 입력:** 마이크 버튼

### 4.2 AI Model Selection (Stitch 동일 구조)

| 모드 | 설명 |
|------|------|
| **3.0 Flash** | 빠른 생성. 반복 수정에 적합 |
| **3.0 Quality** | 최고 품질. 복잡한 레이아웃/인터랙션 |
| **Redesign** | 기존 앱 스크린샷 → 리디자인 + 구동 |
| **Ideate** | 문제 제시 → 솔루션 앱 생성 |

### 4.3 Design Editor

#### 캔버스 기능
- **줌 컨트롤:** 퍼센트 표시, Ctrl/Cmd+스크롤로 조절 (10%~400%)
- **캔버스 패닝:** 빈 영역 클릭+드래그, Space+드래그, Alt+드래그, 중간 마우스 버튼
- **커서 피드백:** Space 누르면 grab 커서, 드래그 중 grabbing 커서
- **멀티 스크린 캔버스:** 여러 스크린을 나란히 배치
- **스크린 선택:** 클릭으로 선택/해제, 선택 시 파란색 테두리 + 크기 표시

#### 좌측 사이드바 도구
- Cursor / Select / Pen
- Mic (음성 입력)
- Image 삽입

#### 우측 플로팅 패널 (Stitch 스타일)
접을 수 있는 3탭 패널 (`RightPanel`):

| 탭 | 내용 |
|---|------|
| **Design** | 테마 이름, 컬러 팔레트 (4역할 × 12톤), 타이포그래피, 디자인 가이드 (편집 가능) |
| **Components** | 버튼 4종, 서치바, 바텀 네비게이션, FAB, 칩, 아이콘 세트 미리보기 |
| **Layers** | 프로젝트 스크린 목록, 클릭으로 스크린 선택/이동 |

- 패널 닫기/열기 토글 버튼
- 디자인 시스템이 아직 생성되지 않았을 때 "Generating..." 스켈레톤 UI 표시

#### Agent Log 패널
- AI 작업 이력 (생성, 추출, 에러)
- 접기/펼치기
- 항목 수 뱃지 표시

#### 하단 프롬프트 바
- 변경/생성 프롬프트 입력
- **선택된 스크린 태그:** 스크린 선택 시 프롬프트 바에 태그 표시
- **디바이스 토글:** App | Tablet | Web 3단 토글
- 파일 첨부, 모델 선택, Generate 버튼

### 4.4 Screen Context Menu (Stitch 기반 + 변경)

스크린 클릭 시 상단 메뉴:

#### Generate 메뉴
| 항목 | 단축키 | 설명 |
|------|--------|------|
| Variations | Shift+V | 선택 스크린의 변형 생성 |
| Regenerate | Shift+R | 스크린 재생성 |
| Desktop web version | - | 데스크톱 웹 버전으로 변환 |
| Predictive heat map | - | 예측 히트맵 생성 |

#### Modify 메뉴
| 항목 | 단축키 | 설명 |
|------|--------|------|
| Edit | E | 직접 편집 모드 |
| Annotate | - | 어노테이션 추가 |
| Design system | - | 디자인 시스템 수정 |

#### Run 메뉴 (Stitch Preview 대체)
| 항목 | 설명 |
|------|------|
| Run in Popup | Live App 팝업 창에서 구동 (없으면 생성, 있으면 포커스) |
| Open in Browser | 시스템 브라우저에서 localhost 열기 |
| Device Frame | Mobile (390x844) / Tablet (1024x1366) / Desktop (1280x800) |
| Always on Top | 팝업 창 항상 위 고정 토글 |
| Open DevTools | 라이브 앱의 Chrome DevTools 열기 |

#### More 메뉴 (Stitch 기반 - Figma 제거)
| 항목 | 단축키 | 설명 |
|------|--------|------|
| View code | Shift+C | 생성된 소스 코드 보기 |
| Open in Editor | Cmd+E | VS Code/Cursor 등 외부 에디터에서 열기 |
| Copy as Code | - | 코드 클립보드 복사 |
| Copy as PNG | Cmd+Shift+C | 스크린 이미지 복사 |
| Download | Shift+D | 프로젝트 폴더 ZIP 다운로드 |

#### 우클릭 컨텍스트 메뉴
- Copy / Copy as (Code, PNG, Link) / Cut / Duplicate / Focus / Favourite / Delete
- Generate 섹션: Variations, Regenerate, Desktop web version, Predictive heat map
- Edit 섹션: Edit, Annotate, Design system
- Run 섹션: Run in Popup, Open in Browser, Device Frame, Always on Top
- View code / Open in Editor / Download

### 4.5 Design System (AI 생성)

AI가 첫 스크린 생성 후 자동으로 디자인 시스템을 추출하며, Stitch와 동일한 구조:

#### Color Palette
- **4개 색상 역할:** Primary, Secondary, Tertiary, Neutral
- **각 색상별 12단계 톤 스케일:** T0(#000000) ~ T100(#ffffff)
  - T0, T10, T20, T30, T40, T50, T60, T70, T80, T90, T95, T100
- **Click to copy:** 색상 코드 클릭 시 HEX 값 클립보드 복사
- **Placeholder 상태:** 디자인 시스템 생성 전 animate-pulse 스켈레톤 표시

#### Typography
- **3개 타이포 레벨:** Headline, Body, Label
- 각 레벨별 폰트 패밀리 지정
- "Aa" 프리뷰 표시

#### Components (우측 패널 Components 탭)
- **Buttons:** Primary, Secondary, Inverted, Outlined 4종
- **Search bar:** 아이콘 + 입력 필드
- **Navigation:** Bottom nav (home, search, person 아이콘)
- **FAB:** Floating Action Button (edit 아이콘)
- **Chip/Label:** 아이콘 + 텍스트 조합
- **Icon set:** 이모지 기반 12종 아이콘 그리드

### 4.6 Design Guide (VibeSynth 고유 기능)

AI가 디자인 시스템 추출 시 함께 생성하는 **디자인 가이드**:

#### 구조 (6개 섹션)
| 섹션 | 설명 |
|------|------|
| **Overview** | 크리에이티브 노스 스타, 디자인 철학 |
| **Color Rules** | 색상 사용 규칙 (서피스 계층, 그라디언트 규칙, No-Line 규칙) |
| **Typography Rules** | 타이포그래피 스케일, 폰트 사용 규칙 |
| **Elevation Rules** | 깊이/엘리베이션 표현 방식 (그림자, 레이어링, 보더) |
| **Component Rules** | 버튼, 입력, 칩, 카드 등 컴포넌트별 디자인 규칙 |
| **Do's & Don'ts** | 디자인 유지에 필수적인 규칙 |

#### 워크플로우
1. **기본 가이드:** `design_guide.md`를 `DEFAULT_DESIGN_GUIDE`로 파싱하여 LLM 프롬프트에 포함
2. **AI 생성:** 첫 스크린 생성 후, AI가 해당 디자인에 맞는 맞춤형 가이드를 자동 생성
3. **편집 가능:** 우측 패널 Design 탭 하단 "Design Guide" 섹션에서 각 항목을 인라인 에디터로 수정
4. **반영:** 수정된 가이드는 이후 스크린 생성 시 AI 프롬프트에 자동 반영

### 4.7 Multi-Screen Management (Stitch 동일)

- 하나의 프로젝트에 여러 스크린(라우트) 생성
- 각 스크린 = 실제 앱의 라우트 (/dashboard, /workout, /progress 등)
- 디자인 시스템 변형으로 테마 스위칭
- 캔버스에서 스크린 간 이동 시 라이브 패널도 해당 라우트로 전환

### 4.8 Live App Window (VibeSynth 고유 - 별도 팝업 창)

Stitch에는 없는 VibeSynth의 핵심 차별점.
메인 캔버스와 분리된 **별도 Electron 팝업 창**으로 구동:

#### IPC 통신
- `updateLiveWindow(html)`: 메인 → 팝업으로 HTML 전송
- `setLiveWindowSize(width, height)`: 디바이스 프레임에 맞게 팝업 크기 조절
- `openExternal(url)`: 외부 브라우저에서 URL 열기
- `onLiveWindowClosed`: 팝업 종료 이벤트 수신

#### 기능
- **별도 창:** 메인 캔버스 공간을 침범하지 않음. 듀얼 모니터 활용 가능
- **Device Frame 전환:** Mobile (390x844) / Tablet (1024x1366) / Desktop (1280x800)
- **창 크기 = 반응형 테스트:** 드래그로 창 크기를 조절하면 곧 반응형 테스트
- **Always on Top:** 항상 위 고정 옵션 (디자인 수정하면서 결과를 계속 확인)
- **DevTools 토글:** Console, Network, Elements 탭
- **Server Status:** Running/Stopped 상태 표시 (타이틀바)
- **[▶ Run] 버튼:** 메인 윈도우 헤더의 Run 버튼으로 팝업 생성/포커스

---

## 5. Navigation & Information Architecture

### 5.1 Dashboard (홈)
```
├── Header
│   ├── VibeSynth 로고 + BETA 배지
│   ├── Appearance 토글 (Light/System/Dark) — 드롭다운 하향
│   ├── Settings (⚙) → 설정 페이지 이동
│   └── More (⋮) → Help & feedback, Keyboard shortcuts, About VibeSynth
├── Left Sidebar
│   ├── 탭: My projects / Shared with me
│   ├── Search projects 입력
│   ├── Recent 프로젝트 목록
│   └── Examples 프로젝트 목록 (그라디언트+이모지 썸네일)
├── Main Content
│   ├── "Welcome to VibeSynth." 헤딩
│   ├── 프롬프트 제안 칩 (3개)
│   └── 프롬프트 입력 영역
│       ├── 텍스트 입력
│       ├── Choose File (이미지 첨부)
│       ├── App / Tablet / Web 3단 토글
│       ├── 모델 선택 (3.0 Flash 기본)
│       └── Generate 버튼
```

#### 예제 프로젝트 (5개, 프롬프트 기반 AI 생성)
| ID | 이름 | 디바이스 | 썸네일 |
|----|------|----------|--------|
| ex1 | Indoor Plant Care Dashboard | App | 🌿 그린 그라디언트 |
| ex2 | SaaS Startup Landing Page | Web | 🚀 인디고 그라디언트 |
| ex3 | Ceramic & Pottery Marketplace | Web | 🏺 테라코타 그라디언트 |
| ex4 | Digital Magazine Reader | Tablet | 📖 그린 그라디언트 |
| ex5 | Homemade Pizza Cooking Elite Class | App | 🍕 레드 그라디언트 |

### 5.2 Editor (메인 윈도우 - 전체 화면 캔버스)
```
├── Header
│   ├── 햄버거 메뉴 (☰)
│   │   ├── Go to all projects → 대시보드로 이동
│   │   ├── Open project folder
│   │   ├── Open in external editor
│   │   ├── Appearance (Light/Dark 토글 동작)
│   │   ├── Settings → 설정 페이지 이동
│   │   └── Command menu (⌘K)
│   ├── 프로젝트 이름
│   ├── [Generating...] 상태 표시
│   ├── [▶ Run] / [■ Stop] 버튼 → Live App 팝업 생성/포커스
│   ├── Appearance 토글 (하향 드롭다운)
│   └── Settings 아이콘 → 설정 이동
├── Canvas Area
│   ├── 좌측 도구바 (Cursor, Select, Pen, Mic, Image)
│   ├── 캔버스 (드래그 패닝 + 줌)
│   │   └── 스크린 카드 목록 또는 빈 상태 플레이스홀더
│   └── 우측 플로팅 패널 (Design / Components / Layers)
│       └── Design 탭 하단: Design Guide 섹션 (접기/펼치기, 인라인 편집)
├── Bottom: Prompt Bar
│   ├── 선택된 스크린 태그 (제거 가능)
│   ├── 텍스트 입력
│   ├── 파일 첨부
│   ├── App / Tablet / Web 토글
│   ├── 모델 선택
│   └── Generate 버튼
├── Agent Log Panel (접기/펼치기, 항목 수 표시)
└── 줌 표시 (100%)
```

### 5.3 Live App (별도 팝업 윈도우)
```
├── Title Bar
│   ├── "Live App" 라벨
│   ├── Device frame selector [📱] [📱] [💻]
│   ├── Always on Top 토글 [📌]
│   ├── DevTools 토글 [🔧]
│   └── Server status (Running ● / Stopped ○)
├── URL Bar
│   └── localhost:PORT/current-route
├── App Content (BrowserView)
│   └── 실제 구동 중인 앱
└── DevTools Panel (선택적)
    ├── Console
    ├── Network
    └── Elements
```

### 5.4 Settings
```
├── Header: ← Back + "Settings" 타이틀
├── General
│   ├── Appearance (Light/System/Dark)
│   ├── Default project path
│   ├── Default framework (React/Vue/Svelte)
│   └── Default dev server port
├── AI
│   ├── API Key 관리
│   ├── Default model
│   └── AI model training opt-in/out
├── Dev Server
│   ├── Node.js path
│   ├── Package manager (npm/yarn/pnpm/bun)
│   └── Auto-start on project open
└── Editor
    ├── External editor path (VS Code/Cursor)
    └── Keyboard shortcuts
```

---

## 6. Technical Architecture

### 6.1 Electron App Structure
```
vibesynth/
├── electron/
│   ├── main.ts              # Electron main process (IPC, 윈도우 관리)
│   └── preload.ts           # Preload scripts (electronAPI 노출)
├── src/renderer/src/
│   ├── App.tsx              # 루트: Project, Screen, DesignSystem, DesignGuide 인터페이스
│   ├── pages/
│   │   ├── Dashboard.tsx    # 대시보드 (예제, 프롬프트, 사이드바)
│   │   ├── Editor.tsx       # 에디터 (캔버스, 패닝, 생성)
│   │   └── Settings.tsx     # 설정 페이지
│   ├── components/
│   │   ├── common/
│   │   │   ├── PromptBar.tsx        # App/Tablet/Web 토글 포함 프롬프트 바
│   │   │   └── AppearanceToggle.tsx # Light/System/Dark 토글
│   │   └── editor/
│   │       ├── RightPanel.tsx       # Design/Components/Layers 3탭 패널
│   │       ├── AgentLog.tsx         # AI 작업 로그
│   │       └── ScreenContextToolbar.tsx
│   ├── lib/
│   │   ├── gemini.ts              # Gemini API 클라이언트 (생성/편집/DS추출)
│   │   └── default-design-guide.ts # design_guide.md 기반 기본 가이드
│   └── types/
│       └── electron.d.ts          # ElectronAPI 타입 정의
├── tests/e2e/
│   ├── dashboard.spec.ts          # 대시보드 기능 테스트
│   ├── editor.spec.ts             # 에디터 기능 테스트
│   ├── header-icons.spec.ts       # 헤더 아이콘/메뉴 테스트
│   ├── parity-dashboard.spec.ts   # Stitch UX 패리티 테스트
│   ├── visual-check.spec.ts       # 스크린샷 비주얼 테스트
│   └── stitch-explore.spec.ts     # Stitch 탐색 (수동 로그인)
├── design_guide.md                # 기본 디자인 가이드 원본
├── .env                           # VITE_GEMINI_API_KEY
├── vite.config.ts                 # Electron 빌드 (envDir 설정)
└── vite.config.web.ts             # 웹 전용 개발 빌드
```

### 6.2 Core Data Models

```typescript
interface Project {
  id: string
  name: string
  prompt?: string           // 원본 프롬프트 (AI 생성 시)
  updatedAt: string
  thumbnail?: string
  screens: Screen[]
  designSystem?: DesignSystem
  deviceType: 'app' | 'web' | 'tablet'
}

interface DesignGuide {
  overview: string          // 크리에이티브 노스 스타
  colorRules: string        // 색상 사용 규칙
  typographyRules: string   // 타이포그래피 규칙
  elevationRules: string    // 깊이/엘리베이션 규칙
  componentRules: string    // 컴포넌트 디자인 규칙
  dosAndDonts: string       // Do's & Don'ts
}

interface DesignSystem {
  name: string
  colors: { primary, secondary, tertiary, neutral } // 각 { base, tones[12] }
  typography: { headline, body, label }              // 각 { family }
  guide?: DesignGuide
}
```

### 6.3 AI Integration (Gemini API)

```
generateDesign(prompt, deviceType, guide?)
  → 디자인 가이드를 프롬프트에 포함
  → HTML+CSS 반환

generateDesignSystem(html, baseGuide?)
  → 생성된 HTML 분석
  → 색상/타이포/이름 + 맞춤형 디자인 가이드 반환

editDesign(currentHtml, editPrompt)
  → 기존 HTML에 변경사항 적용
```

#### 환경 변수
- `.env` 파일의 `VITE_GEMINI_API_KEY` 사용
- `vite.config.ts`에 `envDir: path.resolve(__dirname)` 설정으로 프로젝트 루트에서 로드

---

## 7. Stitch 기능 채택/제거 매핑

### 채택 (100% 동일 구현)
| Stitch 기능 | VibeSynth 구현 |
|-------------|---------------|
| 프롬프트 기반 디자인 생성 | 동일 (Gemini API로 HTML+CSS 생성) |
| App/Web 디바이스 토글 | 확장: **App / Tablet / Web** 3단 토글 |
| AI 모델 선택 (4가지 모드) | 동일 구조 (3.0 Flash/Quality/Redesign/Ideate) |
| 캔버스 에디터 | 동일 + 드래그 패닝/스페이스+드래그 추가 |
| 디자인 시스템 (색상 T0~T100, 타이포, 컴포넌트) | **100% 동일** (AI가 자동 추출) |
| 멀티 스크린 관리 | 동일 (스크린 = 라우트) |
| Agent Log 패널 | 동일 |
| 프롬프트 바 (하단) | 동일 |
| 스크린 컨텍스트 메뉴 (Generate/Modify) | 동일 |
| 우클릭 메뉴 (Copy/Cut/Duplicate/Focus/Favourite/Delete) | 동일 |
| Appearance (Light/System/Dark) | 동일 |
| 프롬프트 제안 칩 | 동일 |
| 이미지 첨부 | 동일 |
| 음성 입력 | 동일 |
| Command menu (⌘K) | 동일 |
| Settings 페이지 | 동일 구조 (항목은 다름) |
| **우측 플로팅 패널** | 동일 (Design/Components/Layers 3탭) |

### 제거
| Stitch 기능 | 이유 |
|-------------|------|
| Figma Export / Copy to Figma | 불필요 - 이미 실제 앱이 구동됨 |
| Preview / Prototype 모드 | 불필요 - 항상 라이브 구동 |
| Docs 페이지 | 불필요 - Electron 앱 내 통합 |
| Share / Shared with me | 로컬 앱이므로 불필요 (추후 검토) |
| Usage credits / Daily limits | 로컬 앱이므로 불필요 |
| Live Mode (Preview) 버튼 | 불필요 - 항상 라이브 |
| QR Code 프리뷰 | 불필요 |

### 신규 추가
| VibeSynth 기능 | 설명 |
|----------------|------|
| Live App Window | 실시간 앱 구동 별도 팝업 창 (듀얼 모니터 활용) |
| Local Dev Server | Vite 기반 로컬 서버 자동 관리 |
| HMR Integration | 디자인 변경 → <100ms 반영 |
| Open in External Editor | VS Code/Cursor에서 코드 편집 |
| Open Project Folder | Finder/Explorer에서 폴더 열기 |
| DevTools Panel | 라이브 앱의 Console/Network/Elements |
| Server Status | Running/Stopped 상태 표시 |
| **Tablet 디바이스 타입** | App/Tablet/Web 3단 토글 (1024x1366) |
| **디자인 가이드 시스템** | AI 생성 + 사용자 편집 가능 디자인 가이드 |
| **기본 디자인 가이드** | `design_guide.md` 기반 기본 가이드를 AI 프롬프트에 포함 |
| **프롬프트 기반 예제** | 하드코딩 대신 프롬프트로 AI 생성 |
| **Dashboard More 메뉴** | Help & feedback, Keyboard shortcuts, About |
| **캔버스 드래그 패닝** | 빈 영역 클릭+드래그, Space+드래그, Alt+드래그 |
| **E2E 테스트 스위트** | Playwright 83개 테스트 (Dashboard, Editor, Header, Parity, Visual) |

---

## 8. Screenshots Reference (Stitch 분석용)

| # | 파일명 | VibeSynth 참고 포인트 |
|---|--------|----------------------|
| 07-16 | 대시보드~디자인 생성 | 대시보드 레이아웃, 프롬프트 입력 UX |
| 24-26 | 우측 메뉴 | 사이드바 도구 구조 |
| 29 | Web 모드 | App/Web 토글 UX |
| 30 | 모델 선택 | 모델 드롭다운 구조 |
| 32-33 | Appearance | Light/Dark 모드 전환 |
| 35 | 햄버거 메뉴 | 에디터 메뉴 구조 |
| 36 | Settings | 설정 페이지 레이아웃 |
| 38 | 멀티 스크린 에디터 | 캔버스 내 스크린 배치, 디자인 시스템 카드 |
| 44-48 | 스크린 컨텍스트 메뉴 | Generate/Modify/More 메뉴 구조 |
| 49-51 | 우클릭 메뉴 | 컨텍스트 메뉴 전체 구조, Copy as 서브메뉴 |

---

## 9. E2E Test Coverage

Playwright 기반 83개 자동화 테스트:

| 테스트 파일 | 개수 | 범위 |
|-------------|------|------|
| `dashboard.spec.ts` | 14 | 대시보드 레이아웃, 사이드바, 프롬프트, 모델, App/Tablet/Web 토글 |
| `editor.spec.ts` | 16 | 에디터 레이아웃, 우측 패널, 탭, 디자인 가이드, 생성 상태 |
| `header-icons.spec.ts` | 14 | Appearance 토글, Settings 이동, More 메뉴, Run 버튼, 햄버거 메뉴 |
| `parity-dashboard.spec.ts` | 22 | VibeSynth vs Stitch UX 패리티 (양쪽 프로젝트 동시 테스트) |
| `visual-check.spec.ts` | 11 | 주요 화면 스크린샷 캡처 (대시보드, 에디터, 다크모드, 패널) |
| `stitch-explore.spec.ts` | 1 | Stitch 수동 탐색 (로그인 필요, page.pause 활용) |
