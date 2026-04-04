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

#### 예제 프로젝트 (LifeFlow 시리즈 6종 — §8.9 참고)

구 예제(식물 대시보드, SaaS 랜딩 등 5종)는 **LifeFlow 통합 테마 예제**로 대체되었다. 카테고리: Landing Page, Homepage, Dashboard, iPhone App, Android App, iPad App. 각 예제는 PRD(마크다운) 확인 → 추천 디자인 시스템 선택 → 생성 플로우를 따른다.

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
│   ├── main.ts              # Electron main process (IPC, 윈도우 관리, 좀비 프로세스 정리)
│   ├── preload.ts           # Preload scripts (electronAPI + pinterest API 노출)
│   └── preload-pinterest.ts # Pinterest 전용 preload (레거시)
├── src/renderer/src/
│   ├── App.tsx              # 루트: Project, Screen, DesignSystem, ComponentTokens, DesignGuide 인터페이스
│   ├── pages/
│   │   ├── Dashboard.tsx    # 대시보드 (예제, 프롬프트, 디자인 시스템 피커)
│   │   ├── Editor.tsx       # 에디터 (캔버스, 패닝, 다중 화면 생성, 증분 빌드)
│   │   └── Settings.tsx     # 설정 페이지
│   ├── components/
│   │   ├── common/
│   │   │   ├── PromptBar.tsx        # App/Tablet/Web 토글 포함 프롬프트 바
│   │   │   ├── AppearanceToggle.tsx # Light/System/Dark 토글
│   │   │   └── MarkdownRenderer.tsx # PRD / Live 개발자 요약 등 MD 렌더
│   │   └── editor/
│   │       ├── RightPanel.tsx       # Design/Components/Layers 3탭 (추천 DS, 컴포넌트 토큰)
│   │       ├── AgentLog.tsx         # AI 작업 로그
│   │       └── ScreenContextToolbar.tsx
│   ├── lib/
│   │   ├── gemini.ts              # Gemini API + Live 편집 의역(paraphrase*) 헬퍼
│   │   ├── live-diff.ts           # Live 수정용 줄 단위 diff 요약(Developer 모드용)
│   │   ├── i18n/                  # en/ko 번역, I18nProvider(index.tsx), 예제 PRD 로케일
│   │   ├── example-projects.ts    # LifeFlow 예제 + getExampleProjects(locale)
│   │   ├── image-gen.ts           # AI 이미지 생성
│   │   ├── design-guide-db.ts     # 디자인 가이드 localStorage 저장/로드
│   │   ├── pinterest-designs.ts   # 13개 추천 디자인 시스템 데이터
│   │   └── default-design-guide.ts # design_guide.md 기반 기본 가이드
│   └── types/
│       └── electron.d.ts          # ElectronAPI 타입 정의 (pinterest API 포함)
├── tests/e2e/
│   ├── lifeflow-examples.spec.ts   # LifeFlow 예제 PRD·디자인 피커·생성
│   ├── live-frontend.spec.ts       # Run → Live 창 → 플로팅 프롬프트 수정
│   ├── full-workflow.spec.ts       # 전체 워크플로우 (생성→히트맵→빌드→수정→증분)
│   ├── steal-design.spec.ts        # Pinterest 디자인 훔치기 테스트
│   ├── steal-dashboard.spec.ts     # 대시보드 디자인 훔치기 테스트
│   ├── recommended-designs.spec.ts # 추천 디자인 시스템 로드 테스트
│   ├── load-design-system.spec.ts  # 디자인 시스템 로드/변경 테스트
│   ├── generate-design-systems.spec.ts # 디자인 시스템 생성/저장 테스트
│   ├── dashboard.spec.ts           # 대시보드 기능 테스트
│   ├── editor.spec.ts              # 에디터 기능 테스트
│   ├── header-icons.spec.ts        # 헤더 아이콘/메뉴 테스트
│   ├── parity-dashboard.spec.ts    # Stitch UX 패리티 테스트
│   ├── visual-check.spec.ts        # 스크린샷 비주얼 테스트
│   └── stitch-explore.spec.ts      # Stitch 탐색 (수동 로그인)
├── design_guide.md                  # 기본 디자인 가이드 원본
├── .env                             # VITE_GEMINI_API_KEY
├── vite.config.ts                   # Electron 빌드 (envDir 설정, pinterest preload)
└── vite.config.web.ts               # 웹 전용 개발 빌드
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

interface Screen {
  id: string
  name: string
  html: string
  heatmap?: HeatmapZone[]
  generating?: boolean      // AI 생성 진행 중 플래그
}

interface HeatmapZone {
  cssPath: string
  tagName: string
  label: string
  intensity: number         // 0.0 ~ 1.0
  reason: string
  rect: { x: number; y: number; w: number; h: number }
}

interface DesignGuide {
  overview: string          // 크리에이티브 노스 스타
  colorRules: string        // 색상 사용 규칙
  typographyRules: string   // 타이포그래피 규칙
  elevationRules: string    // 깊이/엘리베이션 규칙
  componentRules: string    // 컴포넌트 디자인 규칙
  dosAndDonts: string       // Do's & Don'ts
}

interface TypographyLevel {
  family: string
  size?: string             // e.g. "32px"
  weight?: string           // e.g. "700"
  lineHeight?: string       // e.g. "1.2"
}

interface ComponentTokens {
  buttonRadius: string; buttonPadding: string; buttonFontWeight: string
  inputRadius: string; inputBorder: string; inputPadding: string; inputBg: string
  cardRadius: string; cardShadow: string; cardPadding: string
  chipRadius: string; chipPadding: string; chipBg: string
  fabSize: string; fabRadius: string
}

interface DesignSystem {
  name: string
  colors: { primary, secondary, tertiary, neutral } // 각 { base: string, tones: string[12] }
  typography: { headline, body, label }              // 각 TypographyLevel
  components?: ComponentTokens                       // 컴포넌트 CSS 토큰
  guide?: DesignGuide
}
```

### 6.3 AI Integration (Gemini API)

```
generateDesign(prompt, deviceType, guide?, callbacks?, existingHtml?, presetDesignSystem?)
  → 디자인 가이드 + 프리셋 토큰을 프롬프트에 포함
  → HTML+CSS 반환

generateMultiScreen(appDescription, screenNames, deviceType, guide?, callbacks?, presetDesignSystem?)
  → 첫 화면에서 디자인 토큰 추출 → 이후 화면에 일관성 강제
  → 화면별 순차 생성 + 콜백으로 진행 상태 전달

generateDesignSystem(html, baseGuide?)
  → 생성된 HTML 분석
  → 색상/타이포/컴포넌트 토큰/이름 + 맞춤형 디자인 가이드 반환

analyzeDesignFromImage(base64, mimeType)
  → 이미지(Pinterest 등) 분석 → 전체 DesignSystem 추출

editDesign(currentHtml, editPrompt)
  → 기존 HTML에 변경사항 적용

editDesignElement(currentHtml, cssPath, elementOuterHtml, editPrompt)
  → 선택된 특정 요소만 수정

generateHeatmap(html)
  → UX 히트맵 예측 (주목도 0~1, CSS 경로)

generateFrontendApp(screens, deviceType)
  → React + Vite + React Router 프로젝트 풀 빌드

generateIncrementalFrontend(newScreens, allScreens, existingFiles, deviceType)
  → 변경된 화면만 증분 빌드 + App.tsx 라우팅 업데이트

fixBuildErrors(errorOutput, projectFiles)
  → 빌드 에러 자동 수정
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
| **Pinterest 디자인 훔치기** | Pinterest 이미지 → Gemini Vision → DesignSystem 자동 추출 |
| **추천 디자인 시스템** | 13개 큐레이션 디자인 (프리셋 색상/타이포/컴포넌트 토큰) |
| **Dashboard 디자인 피커** | 프로젝트 생성 시 추천 디자인 시스템 미리 선택 가능 |
| **컴포넌트 토큰** | 버튼/입력/카드/칩/FAB CSS 토큰 (DesignSystem 확장) |
| **다중 화면 순차 생성** | 디자인 일관성 강제 + 블러→선명 애니메이션 |
| **증분 빌드** | 변경된 화면만 재빌드, HTML 해시 기반 캐시 |
| **히트맵 예측** | AI UX 히트맵 (주목도 시각화 + 효과 부여) |
| **요소 단위 편집** | 클릭으로 선택한 요소만 AI 수정 |
| **빌드 에러 자동 수정** | Gemini로 컴파일 에러 자동 진단/수정 |
| **좀비 프로세스 정리** | 앱 시작 시 기존 Electron 프로세스 자동 종료 |
| **전체 화면 시작** | Electron 앱 항상 fullscreen으로 시작 |
| **E2E 테스트 스위트** | Playwright 다수 테스트 (워크플로우, 디자인 훔치기, 추천 DS 등) |
| **LifeFlow 예제 + PRD 모달** | 6카테고리 통합 테마, MD 뷰어, 추천 DS 후 생성 |
| **영/한 i18n** | Context 기반 `t()` , 설정·헤더 언어 전환, 예제 PRD 로케일 |
| **공용 MarkdownRenderer** | 테이블·목록·코드 펜스 지원 (대시보드 PRD 등) |

---

## 8. Implemented Features (Phase 2+)

아래는 초기 PRD 이후 추가 구현된 기능들이다.

### 8.1 Pinterest Design Steal (디자인 훔치기)

Pinterest 이미지에서 디자인 시스템을 추출하여 프로젝트에 적용하는 기능.

#### 워크플로우
1. **Pinterest 연결:** `Connect Pinterest Account` 버튼 → 시스템 기본 브라우저(`shell.openExternal`)로 Pinterest 로그인
2. **이미지 URL 입력:** 디자인 탭에서 Pinterest 이미지 URL을 붙여넣기
3. **분석:** Electron main process에서 `net.fetch`로 이미지 다운로드 → Gemini Vision API(`gemini-2.0-flash`)로 분석
4. **적용:** 추출된 `DesignSystem`(색상, 타이포, 컴포넌트 토큰, 가이드)을 프로젝트에 즉시 적용

#### 검색 카테고리
- Homepage Design / iPhone App Design / Android App Design / iPad App Design / **Dashboard Design**

#### IPC 채널
- `pinterest:connect` — 시스템 브라우저로 로그인 페이지 오픈
- `pinterest:open` — 카테고리 검색 결과를 시스템 브라우저에서 오픈
- `pinterest:steal-url` — 이미지 URL로 직접 분석 (main process에서 다운로드)
- `pinterest:image-captured` — 분석 완료 시 renderer에 결과 전송

### 8.2 Recommended Design Systems (추천 디자인 시스템)

13개의 Pinterest 소스 디자인을 사전 분석하여 앱 내에 큐레이션된 추천 디자인으로 제공.

#### 데이터 구조
```typescript
interface PinterestDesignEntry {
  id: string           // e.g. "pin-finance-dashboard"
  name: string         // e.g. "Ornate Quartz"
  keywords: string[]   // 검색 키워드
  mood: string[]       // 분위기 태그
  domains: string[]    // 적용 도메인
  previewUrl: string   // 원본 Pinterest 이미지 URL
  designSystem: DesignSystem  // 전체 디자인 시스템 (colors, typography, components)
  guide: DesignGuide          // 디자인 가이드
}
```

#### UI 위치
- **Design 탭 → "Recommended Designs"** 접기/펼치기 섹션
  - 2열 그리드로 색상 스와치 + 폰트 프리뷰 표시
  - 클릭 시 해당 디자인 시스템을 프로젝트에 로드
- **Dashboard → Design Style Picker** (프롬프트 바 상단)
  - 프로젝트 생성 시 디자인 시스템을 미리 선택 가능
  - 예제 프로젝트에도 적용 가능
  - "Auto" 옵션으로 AI 자동 결정 지원

#### 포함된 13개 디자인
| ID | 이름 | 분위기 |
|----|------|--------|
| pin-finance-dashboard | Ornate Quartz | dark, tech |
| pin-dark-analytics | Finance Oasis | dark, premium |
| pin-gradient-cards | Gradient Pulse | vibrant, modern |
| pin-clean-saas | Clean SaaS | minimal, professional |
| pin-mint-dashboard | Airy Mint Design | fresh, calm |
| pin-orange-crm | Orange CRM | warm, energetic |
| pin-purple-analytics | Purple Analytics | deep, sophisticated |
| pin-blue-dashboard | Blue Dashboard | corporate, clean |
| pin-green-eco | Green Eco | natural, organic |
| pin-red-social | Red Social | bold, social |
| pin-teal-health | Teal Health | calming, health |
| pin-yellow-learning | Yellow Learning | cheerful, education |
| pin-pink-lifestyle | Pink Lifestyle | soft, lifestyle |

### 8.3 Design System Picker (Dashboard 디자인 시스템 선택기)

프로젝트 생성 시점에 추천 디자인 시스템을 선택하여, 첫 화면부터 해당 스타일로 생성.

#### 동작 방식
1. Dashboard 프롬프트 바 상단에 `"Choose a design style (optional)"` 토글
2. 클릭 시 13개 추천 디자인의 색상 스와치 그리드 표시 (반응형 4~7열)
3. 선택된 디자인 시스템이 `Project.designSystem`에 설정됨
4. Gemini 프롬프트에 구체적 토큰(색상 hex, 폰트, 컴포넌트 CSS 값) 포함
5. 예제 프로젝트 클릭 시에도 선택된 디자인 시스템 적용

#### 데이터 플로우
```
Dashboard (designSystem 선택)
  → onCreateProject(prompt, deviceType, designSystem?)
    → App.tsx: Project { designSystem } 설정
      → Editor: activeGuide = project.designSystem.guide
        → generateDesign/generateMultiScreen에 presetDesignSystem 전달
          → Gemini 프롬프트에 구체적 토큰 + 가이드 포함
```

### 8.4 Extended Design System (확장된 디자인 시스템)

#### ComponentTokens (컴포넌트 토큰)
```typescript
interface ComponentTokens {
  buttonRadius: string       // e.g. "8px"
  buttonPadding: string      // e.g. "10px 20px"
  buttonFontWeight: string   // e.g. "600"
  inputRadius: string        // e.g. "8px"
  inputBorder: string        // e.g. "1px solid #ccc"
  inputPadding: string       // e.g. "10px 14px"
  inputBg: string            // e.g. "#ffffff"
  cardRadius: string         // e.g. "12px"
  cardShadow: string         // e.g. "0 2px 8px rgba(0,0,0,0.08)"
  cardPadding: string        // e.g. "20px"
  chipRadius: string         // e.g. "9999px"
  chipPadding: string        // e.g. "4px 12px"
  chipBg: string             // e.g. "#f0f0f0"
  fabSize: string            // e.g. "56px"
  fabRadius: string          // e.g. "16px"
}
```

#### TypographyLevel 확장
```typescript
interface TypographyLevel {
  family: string
  size?: string        // e.g. "32px"
  weight?: string      // e.g. "700"
  lineHeight?: string  // e.g. "1.2"
}
```

#### Components 탭 개선
- **Typography 프리뷰:** Headline/Body/Label 각 레벨의 size, weight, lineHeight 표시
- **Text Input 프리뷰:** 기본 입력 필드 + 라벨 포함 입력 필드
- **Card 프리뷰:** 타이틀, 설명, 액션 버튼 포함
- **Button/Search/FAB/Chip:** `ComponentTokens`에서 동적으로 스타일 로드
- **Icon Set:** Material SVG 아이콘으로 교체

### 8.5 Multi-Screen Generation (다중 화면 생성)

#### 순차 생성 + 애니메이션
1. AI가 프롬프트에서 화면 이름 목록을 먼저 분석
2. 첫 화면 생성 → 디자인 토큰 추출 → 이후 화면들은 동일 토큰 강제 적용
3. 각 화면 생성 시 캔버스에 블러 → 선명 애니메이션 효과

#### 디자인 일관성 강제
```
첫 화면 → extractDesignTokens(html)
  → EXACT COLORS, FONT FAMILIES, BORDER RADIUS, BOX SHADOWS, FULL CSS
    → 이후 화면 프롬프트에 "MANDATORY DESIGN CONSISTENCY" 블록으로 포함
```

### 8.6 Incremental Build (증분 빌드)

기존 빌드된 화면의 HTML이 변경되지 않았으면 Gemini 재생성을 건너뜀.

#### 빌드 캐시
```typescript
// screenId → { htmlHash, generatedFiles }
buildCacheRef = useRef<Map<string, { htmlHash: string; files: Record<string, string> }>>()
```

#### 동작
1. 각 화면의 HTML 해시를 비교
2. 변경된 화면만 `generateIncrementalFrontend()`에 전달
3. `App.tsx` 라우팅만 전체 재생성 (새 화면 라우트 추가)
4. 빌드 에러 발생 시 `fixBuildErrors()`로 자동 수정 시도

### 8.7 Electron Process Management

#### 좀비 프로세스 정리
앱 시작 시 `killZombieElectrons()` 함수가 기존의 Electron 헬퍼 프로세스를 자동 종료:
- macOS: `ps aux | grep Electron` → 자기 프로세스 제외하고 `process.kill()`
- Windows: `tasklist` 기반 동일 로직

#### 전체 화면 시작
`mainWindow.setFullScreen(true)` — 항상 전체 화면 모드로 시작

### 8.8 Design Guide Persistence (디자인 가이드 저장)

#### DesignGuideStore (localStorage)
```typescript
interface DesignGuideEntry {
  id: string
  name: string
  prompt: string
  guide: DesignGuide
  createdAt: string
  source: 'generated' | 'edited' | 'curated'
  previewUrl?: string
}
```

- **저장:** AI 생성 후 자동 저장, 사용자 편집 시 저장
- **로드:** Design 탭의 "Save / Load" 섹션에서 저장된 디자인 시스템 목록 표시
- **큐레이션:** `PINTEREST_DESIGNS` 데이터가 curated 엔트리로 자동 통합
- **삭제:** 앱 시작 시 `deleteAllSaved()`로 이전 AI 생성 데이터 초기화 (curated는 보존)

### 8.9 LifeFlow Example Projects (통합 테마 예제)

**주제:** 생활 패턴 기록·AI 코칭 앱 **LifeFlow**와, 이를 둘러싼 회사 홈페이지·랜딩·운영 대시보드를 **하나의 세계관**으로 묶은 6개 예제.

| 카테고리 | 예제 ID (개략) | 디바이스/형태 |
|----------|----------------|---------------|
| Landing Page | ex-landing | Web — 서비스 소개 랜딩 |
| Homepage | ex-homepage | Web — 회사 공식 사이트 |
| Dashboard | ex-dashboard | Web — 회원/구독 어드민 |
| iPhone App | ex-iphone | App |
| Android App | ex-android | App |
| iPad App | ex-ipad | Tablet |

#### 사용자 플로우
1. 대시보드 **LifeFlow Examples**에서 카드 선택  
2. **PRD 모달:** 마크다운 뷰어로 제품 요구사항(영문/한글 UI에 맞춰 `getExampleProjects(locale)`로 로드)  
3. **추천 디자인 시스템** 선택(선택) 후 **Generate**  
4. AI용 `project.prompt`는 영어 유지(모델 품질), UI·PRD만 로케일 반영

#### 데이터
- `src/renderer/src/lib/i18n/en-examples.ts`, `ko-examples.ts` — 이름·카테고리 라벨·PRD 본문·제안 칩  
- `src/renderer/src/lib/example-projects.ts` — `getExampleCategories`, `getSuggestions`, `getExampleProjects`

### 8.10 Internationalization (i18n, EN / KO)

**방식:** 외부 i18n 라이브러리 없이 **React Context + `en.ts` / `ko.ts`** 타입 안전 키(`TranslationKey`).

#### 범위
- **번역:** 앱 크롬(대시보드, 에디터, 설정, 우측 패널, 프롬프트 바, Appearance, Agent Log, 스크린 컨텍스트 툴바 등), Agent Log에 표시되는 메시지 키  
- **로케일 예제 콘텐츠:** LifeFlow PRD·예제명·카테고리 라벨·제안 칩  
- **비번역:** Gemini 시스템/생성 프롬프트, Pinterest 추천 디자인 **이름**(브랜딩), 콘솔 로그

#### 지속성·UI
- `localStorage` 키 `vibesynth-lang` (`en` | `ko`), 초기값은 저장값 또는 `navigator.language`  
- **설정:** General → Language (English / 한국어)  
- **헤더:** 대시보드·에디터에 **KO / EN** 토글 버튼(빠른 전환)

#### 구현 파일
- `src/renderer/src/lib/i18n/index.tsx` — `I18nProvider`, `useI18n`, `t(key, vars?)` (JSX 사용으로 **`.tsx` 확장자**)  
- `src/renderer/src/lib/i18n/en.ts`, `ko.ts`  
- `App.tsx` — 루트를 `I18nProvider`로 래핑

### 8.11 Live Preview Edit & Designer / Developer Mode (**구현 중**)

라이브 Vite 앱 창(`preload-live.ts` 플로팅 바)에서 입력한 수정 요청은 IPC `live-edit-request` → 메인 에디터에서 `editFrontendFile`로 `src/App.tsx` 등을 갱신한다.

#### 완료·준비된 코드 (UI 미연동 또는 부분 연동)
- **`paraphraseLiveEditForDesigner` / `paraphraseLiveEditFailure`** (`gemini.ts`) — 성공/실패 시 LLM 출력을 디자이너 친화 문장으로 의역  
- **`buildLiveEditDeveloperMarkdown`** (`live-diff.ts`) — 수정 파일·줄 수·줄 단위 발췌·다음 단계 안내를 마크다운으로 생성  
- **`MarkdownRenderer`** — 코드 펜스(```) 지원, PRD·개발자 요약 공용  
- **`electron/main.ts`** — `expandUserPath`, `listRelativePathsSync`, `copyProjectTree` 등 **Live Export용 헬퍼**가 이미 존재하나, **`project:list-relative-paths` / `project:export-to-folder` / `shell:open-vscode` IPC 핸들러는 아직 등록되지 않음** (다음 작업)

#### 목표 동작 (명세)
| 모드 | 설명 |
|------|------|
| **Designer** | Live 수정 후 Agent Log·라이브 창 상태에 **원시 LLM 텍스트 대신** 의역된 설명 표시 |
| **Developer** | 수정된 파일·diff 요약을 **MD 뷰어**로 표시, **Live Export**(프로젝트 전체를 지정 워크스페이스 폴더로 복사), **VS Code 열기**(`code` CLI 등) |

---

## 9. Screenshots Reference (Stitch 분석용)

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

## 10. E2E Test Coverage

Playwright 기반 자동화 테스트:

| 테스트 파일 | 범위 |
|-------------|------|
| `lifeflow-examples.spec.ts` | LifeFlow 예제: 사이드바·PRD 모달·디자인 스타일·Generate 플로우 |
| `live-frontend.spec.ts` | 멀티 스크린 → Run → 프론트 생성 → Live 창 + 플로팅 바 수정 |
| `full-workflow.spec.ts` | 전체 워크플로우: 3화면 생성 → 히트맵 → 빌드 → 런타임 수정 → 추가 화면 → 증분 빌드 |
| `steal-design.spec.ts` | Pinterest 디자인 훔치기 (SaaS 프로젝트 + 이미지 URL 분석) |
| `steal-dashboard.spec.ts` | 대시보드 디자인 훔치기 (컴포넌트 토큰 검증 포함) |
| `recommended-designs.spec.ts` | 13개 추천 디자인 로드/적용/전환 검증 |
| `load-design-system.spec.ts` | 저장된 디자인 시스템 로드/변경 테스트 |
| `generate-design-systems.spec.ts` | 디자인 시스템 생성/저장 반복 테스트 |
| `dashboard.spec.ts` | 대시보드 레이아웃, 사이드바, 프롬프트, 모델, App/Tablet/Web 토글 |
| `editor.spec.ts` | 에디터 레이아웃, 우측 패널, 탭, 디자인 가이드, 생성 상태 |
| `header-icons.spec.ts` | Appearance 토글, Settings 이동, More 메뉴, Run 버튼, 햄버거 메뉴 |
| `parity-dashboard.spec.ts` | VibeSynth vs Stitch UX 패리티 (양쪽 프로젝트 동시 테스트) |
| `visual-check.spec.ts` | 주요 화면 스크린샷 캡처 (대시보드, 에디터, 다크모드, 패널) |
| `stitch-explore.spec.ts` | Stitch 수동 탐색 (로그인 필요, page.pause 활용) |

---

## 11. 다음 작업 (Explicit Backlog)

아래는 **현재 코드베이스 기준**으로 PRD와 구현의 갭을 메우기 위한 **명시적 다음 작업**이다. 우선순위는 제품 목표에 따라 조정 가능하다.

### 11.1 Live: Designer / Developer 모드 완성
1. **에디터 상태:** `localStorage`(예: `vibesynth-live-feedback-mode`)로 `designer` | `developer` 저장, 헤더 또는 Live 관련 구역에 세그먼트 토글 UI 추가.  
2. **Live edit 핸들러 (`Editor.tsx` `onLiveEditRequest`):**  
   - 성공 시: Designer 모드면 `paraphraseLiveEditForDesigner` 호출 후 Agent Log·`sendLiveEditResult`에 **사용자용 문구** 전달.  
   - Developer 모드면 `buildLiveEditDeveloperMarkdown`으로 MD 생성 후 모달(또는 사이드 패널)에 `MarkdownRenderer`로 표시.  
3. **`live-edit-result` 페이로드 확장:** `userFacingMessage` 등 선택 필드 추가 → `electron/main.ts` / `preload-live.ts`에서 라이브 창 상태 텍스트에 반영(긴 텍스트는 말줄임 처리).  
4. **실패 시:** Designer 모드에서 `paraphraseLiveEditFailure` 호출.

### 11.2 Live Export + VS Code 연동
1. **`electron/main.ts`:** `project:list-relative-paths`, `project:export-to-folder`, `shell:open-vscode` IPC 등록(이미 존재하는 `copyProjectTree` 활용).  
2. **`preload.ts` / `electron.d.ts`:** renderer API 노출.  
3. **설정:** Live Export 대상 루트 경로·VS Code CLI 명령(기본 `code`) — `localStorage` 또는 `DBUserSettings` 확장 후 Settings UI 연동.  
4. **Developer 모드 UI:** “Export”, “Open in VS Code” 버튼 → IPC 호출 후 토스트/로그 피드백.

### 11.3 예제 Live 스모크 & 자동 수정 루프 (선택·고비용)
- **목표:** LifeFlow 6예제(또는 대표 1~2개)에 대해 Run → Live 수정 → 빌드/런타임 오류 시 `fixBuildErrors` 등으로 **자동 복구 루프**를 돌릴 때까지 E2E 또는 스크립트 반복.  
- **전제:** `VITE_GEMINI_API_KEY`, 충분한 타임아웃, CI 비용 허용.  
- **산출:** `tests/e2e/lifeflow-live-smoke.spec.ts`(또는 유사) + 실패 시 스크린샷·로그 수집.

### 11.4 문서·품질
- 본 PRD의 §8.11·§11를 구현 완료 시 **“구현 중” 표기 제거** 및 스크린샷/짧은 GIF(선택) 보강.  
- `editFrontendFile`이 단일 파일(`src/App.tsx`)만 수정하는 한계가 있으면, 다중 파일 Live 편집 필요 여부를 PRD에 별도 항목으로 검토.

### 11.5 기타 정리
- **좌측 사이드바 리사이즈** 등 이전에 완료된 UX는 §4.3에 한 줄 보강 가능.  
- **i18n:** 신규 문자열 추가 시 `en.ts` / `ko.ts` 키 동시 추가 원칙 유지.
