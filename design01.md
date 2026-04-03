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

2. AI가 실제 코드 생성 → 로컬 프로젝트 폴더에 파일 쓰기
   ~/VibeSynth/projects/fitness-app/
   ├── src/
   │   ├── App.tsx
   │   ├── components/
   │   ├── styles/
   │   └── design-system/
   ├── package.json
   └── vite.config.ts

3. 로컬 dev server 자동 시작 (Vite)
   → localhost:5173

4. Live App 팝업 창에서 실제 앱 구동
   → 디자인 변경 시 HMR로 <100ms 반영
   → 별도 창이므로 다른 모니터/위치에 자유롭게 배치 가능
```

### 3.2 Window Layout (메인 + 팝업)

**Main Window (Design Canvas) - 전체 화면 활용:**
```
┌──────────────────────────────────────────────────────────┐
│  ☰ VibeSynth    [프로젝트명]              [▶ Run]    [⚙]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Design Canvas (전체 화면)                                │
│                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│   │ 디자인 시스템   │  │   Screen 1   │  │   Screen 2   │  │
│   │ (Kinetic Volt) │  │              │  │              │  │
│   │              │  │              │  │              │  │
│   │ Aa Aa Aa     │  │              │  │              │  │
│   │ ████████     │  │              │  │              │  │
│   └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│   ┌──────────────┐  ┌──────────────┐                    │
│   │   Screen 3   │  │   Screen 4   │                    │
│   │              │  │              │                    │
│   └──────────────┘  └──────────────┘                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ [+] [📎] What would you like to change?  [🎤] [Model ▾] [↑] │
├──────────────────────────────────────────────────────────┤
│ ✦ Agent log ∨                                            │
└──────────────────────────────────────────────────────────┘
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

### 4.1 AI Design Generation (Stitch 동일)

- **텍스트 프롬프트** → AI가 실제 React/Vue/Svelte 코드 생성
- **2가지 타입:** App (모바일) / Web (데스크톱)
- **프롬프트 제안 칩:** 클릭하면 바로 생성
- **이미지 첨부:** 참고 디자인 업로드
- **음성 입력:** 마이크 버튼

### 4.2 AI Model Selection (Stitch 동일 구조)

| 모드 | 설명 |
|------|------|
| **Fast** | 빠른 코드 생성. 반복 수정에 적합 |
| **Quality** | 최고 품질. 복잡한 레이아웃/인터랙션 |
| **Redesign** | 기존 앱 스크린샷 → 리디자인 + 구동 |
| **Ideate** | 문제 제시 → 솔루션 앱 생성 |

### 4.3 Design Editor (Stitch 캔버스 기반)

#### 캔버스 기능 (Stitch 동일)
- 줌 컨트롤 (퍼센트 표시)
- Pan 모드 (H)
- 멀티 스크린 캔버스
- 디자인 시스템 카드 표시

#### 좌측 사이드바 도구 (Stitch 동일)
- Cursor / Select / Pen
- Mic (음성 입력)
- Image 삽입
- Choose File

#### Agent Log 패널 (Stitch 동일)
- AI 작업 이력
- 접기/펼치기

#### 하단 프롬프트 바 (Stitch 동일)
- 변경/생성 프롬프트 입력
- 파일 첨부, 모델 선택
- Generate 버튼

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
| Device Frame | Mobile (390x884) / Tablet (768x1024) / Desktop (1280x1024) |
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

### 4.5 Design System (Stitch 100% 동일)

AI가 프로젝트 생성 시 자동으로 디자인 시스템을 생성하며, Stitch와 완전히 동일한 구조:

#### Color Palette
- **4개 색상 역할:** Primary, Secondary, Tertiary, Neutral
- **각 색상별 12단계 톤 스케일:** T0(#000000) ~ T100(#ffffff)
  - T0, T10, T20, T30, T40, T50, T60, T70, T80, T90, T95, T100
- **Click to copy:** 색상 코드 클릭 시 HEX 값 클립보드 복사
- 예시 (Kinetic Volt 테마):
  - Primary: #CCFF00
  - Secondary: #A2A003
  - Tertiary: #C4AB04
  - Neutral: #121212

#### Typography
- **3개 타이포 레벨:** Headline, Body, Label
- 각 레벨별 폰트 패밀리 지정 (예: Lexend, Inter)
- "Aa" 프리뷰 표시

#### Components
- **Buttons:** Primary, Secondary, Inverted, Outlined 4종
- **Search bar:** 아이콘 + 입력 필드
- **Navigation:** Bottom nav (home, search, person 아이콘)
- **FAB:** Floating Action Button (edit 아이콘)
- **Chip/Label:** 아이콘 + 텍스트 조합
- **Icon set:** Material Icons (auto_fix_high, category, sell, delete 등)

#### 디자인 시스템 카드 (캔버스 표시)
```
┌─────────────────────────────────────┐
│ 🎨 Theme Name (예: Kinetic Volt)     │
├─────────────────────────────────────┤
│ Primary    Secondary   Tertiary     │
│ ████████   ████████    ████████     │
│ #CCFF00    #A2A003     #C4AB04      │
│ T0 ■ T10 ■ T20 ■ ... T95 ■ T100 ■ │
│                                     │
│ Headline: Lexend     Aa             │
│ Body: Inter          Aa             │
│ Label: Inter         Aa             │
│                                     │
│ [Primary] [Secondary]               │
│ [Inverted] [Outlined]               │
│ 🔍 Search                           │
│ 🏠  🔍  👤                           │
│ ✏️ Label                             │
│ ✨ 📦 🏷 🗑                           │
└─────────────────────────────────────┘
```

### 4.6 Multi-Screen Management (Stitch 동일)

- 하나의 프로젝트에 여러 스크린(라우트) 생성
- 각 스크린 = 실제 앱의 라우트 (/dashboard, /workout, /progress 등)
- 디자인 시스템 변형 (예: "Blue Accent")으로 테마 스위칭
- 캔버스에서 스크린 간 이동 시 라이브 패널도 해당 라우트로 전환

### 4.7 Live App Window (VibeSynth 고유 - 별도 팝업 창)

Stitch에는 없는 VibeSynth의 핵심 차별점.
메인 캔버스와 분리된 **별도 Electron 팝업 창**으로 구동:

#### 기능
- **별도 창:** 메인 캔버스 공간을 침범하지 않음. 듀얼 모니터 활용 가능
- **Device Frame 전환:** Mobile / Tablet / Desktop 해상도
- **창 크기 = 반응형 테스트:** 드래그로 창 크기를 조절하면 곧 반응형 테스트
- **Always on Top:** 항상 위 고정 옵션 (디자인 수정하면서 결과를 계속 확인)
- **DevTools 토글:** Console, Network, Elements 탭
- **Server Status:** Running/Stopped 상태 표시 (타이틀바)
- **URL Bar:** 현재 라우트 표시, 직접 입력으로 네비게이션
- **Refresh:** 수동 새로고침 (HMR 외에 필요 시)
- **[▶ Run] 버튼:** 메인 윈도우 헤더의 Run 버튼으로 팝업 생성/포커스

---

## 5. Navigation & Information Architecture

### 5.1 Dashboard (홈)
```
├── Header
│   ├── VibeSynth 로고
│   └── Settings (⚙)
├── Left Sidebar
│   ├── My projects
│   ├── Search projects
│   ├── Recent 프로젝트 목록
│   └── Examples 프로젝트 목록
├── Main Content
│   ├── "Welcome to VibeSynth." 헤딩
│   ├── 프롬프트 제안 칩
│   └── 프롬프트 입력 영역
│       ├── 텍스트 입력
│       ├── Choose File (이미지 첨부)
│       ├── App/Web 토글
│       ├── 모델 선택
│       └── Generate 버튼
└── Appearance 토글 (Light/System/Dark)
```

### 5.2 Editor (메인 윈도우 - 전체 화면 캔버스)
```
├── Header
│   ├── 햄버거 메뉴
│   │   ├── Go to all projects
│   │   ├── Open project folder
│   │   ├── Open in external editor
│   │   ├── Appearance
│   │   ├── Settings
│   │   └── Command menu (⌘K)
│   ├── 프로젝트 이름
│   ├── [▶ Run] / [■ Stop] 버튼 → 클릭 시 Live App 팝업 생성/포커스
│   └── Settings
├── Design Canvas (전체 화면)
│   ├── 좌측 도구바 (Cursor, Select, Pen, Mic, Image)
│   ├── 캔버스 (디자인 시스템 카드 + 스크린 목록)
│   ├── 우측 사이드바 도구 아이콘
│   └── 줌 컨트롤 + Helpful links
├── Bottom: Prompt Bar
│   ├── 선택된 스크린 태그
│   ├── 텍스트 입력
│   ├── 파일 첨부
│   ├── 모델 선택
│   └── Generate 버튼
└── Agent Log Panel (접기/펼치기)
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
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload scripts
│   ├── dev-server.ts        # 로컬 dev server 관리
│   ├── file-watcher.ts      # 파일 변경 감지
│   └── project-manager.ts   # 프로젝트 CRUD
├── src/                     # Renderer (UI)
│   ├── canvas/              # 디자인 캔버스 (메인 윈도우)
│   ├── live-window/         # 라이브 앱 팝업 창
│   ├── prompt-bar/          # 하단 프롬프트
│   ├── agent-log/           # AI 에이전트 로그
│   ├── design-system/       # 디자인 시스템 UI
│   └── settings/            # 설정
├── templates/               # 프로젝트 템플릿
│   ├── react-vite/
│   ├── vue-vite/
│   └── svelte-vite/
└── ai/
    ├── code-generator.ts    # AI → 코드 생성
    ├── design-system.ts     # 디자인 시스템 생성
    └── diff-applier.ts      # 코드 변경사항 적용
```

### 6.2 Live Reload Pipeline
```
사용자 디자인 변경
  ↓
AI가 코드 diff 생성
  ↓
diff-applier가 로컬 파일 수정
  ↓
Vite HMR이 변경 감지
  ↓
Live App Panel에 즉시 반영 (<100ms)
```

### 6.3 Project Structure (생성되는 앱)
```
~/VibeSynth/projects/my-app/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── routes/
│   │   ├── Dashboard.tsx
│   │   ├── WorkoutPlans.tsx
│   │   └── ProgressCharts.tsx
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── SearchBar.tsx
│   │   ├── NavBar.tsx
│   │   └── ...
│   ├── design-system/
│   │   ├── tokens.ts         # 색상/타이포 토큰
│   │   ├── theme.ts          # 테마 설정
│   │   └── components.ts     # 컴포넌트 스타일
│   └── styles/
│       └── global.css
├── public/
├── package.json
├── vite.config.ts
├── DESIGN.md                 # 디자인 사양 문서
└── .vibesynth/
    ├── project.json          # VibeSynth 메타데이터
    ├── screens.json          # 스크린 매핑 정보
    └── design-system.json    # 디자인 시스템 원본
```

### 6.4 Design System → Code 매핑

디자인 시스템이 실제 코드로 변환되는 방식:

```typescript
// design-system/tokens.ts (자동 생성)
export const colors = {
  primary: {
    base: '#CCFF00',
    T0: '#000000', T10: '#161e00', T20: '#283500',
    T30: '#3c4d00', T40: '#506600', T50: '#668100',
    T60: '#7c9c00', T70: '#93b900', T80: '#abd600',
    T90: '#c3f400', T95: '#daff6e', T100: '#ffffff',
  },
  secondary: { /* ... */ },
  tertiary: { /* ... */ },
  neutral: { /* ... */ },
}

export const typography = {
  headline: { fontFamily: 'Lexend', /* weights, sizes */ },
  body: { fontFamily: 'Inter', /* ... */ },
  label: { fontFamily: 'Inter', /* ... */ },
}
```

---

## 7. Stitch 기능 채택/제거 매핑

### 채택 (100% 동일 구현)
| Stitch 기능 | VibeSynth 구현 |
|-------------|---------------|
| 프롬프트 기반 디자인 생성 | 동일 (단, 코드 직접 생성) |
| App/Web 디바이스 토글 | 동일 |
| AI 모델 선택 (4가지 모드) | 동일 구조 (모델은 다를 수 있음) |
| 캔버스 에디터 | 동일 |
| 디자인 시스템 (색상 T0~T100, 타이포, 컴포넌트) | **100% 동일** |
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
| Framework Selection | React/Vue/Svelte 선택 |
| Package Manager Selection | npm/yarn/pnpm/bun 선택 |

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
