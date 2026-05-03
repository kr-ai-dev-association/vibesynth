/**
 * Phase 2 — convert each design screen's HTML into a Jetpack Compose
 * @Composable function via Gemini, then assemble the project's
 * MainActivity to switch between them via simple state.
 *
 * Cache strategy: each screen's generated body is stored on disk
 * keyed by sha1(html). On rerun, only screens whose HTML changed are
 * re-sent to Gemini.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface DesignSystemLite {
  name?: string
  colors?: {
    primary?: { base?: string }
    secondary?: { base?: string }
    neutral?: { base?: string }
  }
  typography?: {
    body?: { font?: string }
    headline?: { font?: string }
  }
}

export interface ScreenForCodegen {
  id: string
  name: string  // human label, becomes Composable function name suffix
  html: string  // full HTML/CSS of the screen
}

export interface KotlinScreen {
  /** safe Composable function name — e.g. "Home", "ProductList" */
  composableName: string
  /** body of the @Composable fun ScreenContent() {...} (without imports) */
  composableBody: string
  /** content hash — used for cache invalidation */
  htmlHash: string
}

const KOTLIN_CACHE_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'vibesynth', 'android-codegen-cache')

function sha1(s: string): string {
  return crypto.createHash('sha1').update(s).digest('hex')
}

function safeComposableName(name: string): string {
  // PascalCase, alphanum only.
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Screen'
  return parts.map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join('')
}

// ─── Gemini prompt ────────────────────────────────────────────

// Bumping this version invalidates the on-disk codegen cache the next time
// the user runs Android — useful when we tighten the prompt to fix recurring
// LLM mistakes (wrong icon names, deprecated APIs, etc.).
const PROMPT_VERSION = 'v2-2026-05-03'

const SYSTEM_PROMPT = `You are an expert Android Kotlin Jetpack Compose engineer.

Convert the provided HTML/CSS design into a single Jetpack Compose function body.

STRICT OUTPUT FORMAT (no exceptions):
- Output ONLY the body of a @Composable function — i.e. the code that goes
  *inside* the curly braces of \`@Composable fun ScreenContent() { ... }\`.
- DO NOT include the function signature, imports, package declaration, or
  markdown code fences.
- The first line of your output should be a Compose call (e.g.
  \`Surface(...)\` or \`Column(...)\`).

ALLOWED IMPORTS (already in scope — DO NOT emit import statements):
- androidx.compose.foundation.* (background, border, layout, clickable)
- androidx.compose.foundation.layout.* (Column, Row, Box, Spacer, padding,
  fillMaxSize, fillMaxWidth, height, width, size, weight, Arrangement,
  Alignment, PaddingValues)
- androidx.compose.foundation.shape.RoundedCornerShape
- androidx.compose.material3.* (Surface, Button, OutlinedButton, TextButton,
  Text, OutlinedTextField, Card, Icon, IconButton, Divider, Scaffold,
  TopAppBar, BottomAppBar, FloatingActionButton, MaterialTheme,
  ScrollableTabRow, Tab)
- androidx.compose.material.icons.Icons
- androidx.compose.material.icons.filled.*  (use Icons.Default.<Name>)
- androidx.compose.runtime.* (remember, mutableStateOf, getValue, setValue)
- androidx.compose.ui.Modifier
- androidx.compose.ui.Alignment
- androidx.compose.ui.draw.clip
- androidx.compose.ui.unit.dp
- androidx.compose.ui.unit.sp
- androidx.compose.ui.graphics.Color
- androidx.compose.ui.text.font.FontWeight
- androidx.compose.ui.text.style.TextAlign

CONVERSION RULES:
- <div> → Column (vertical) or Row (horizontal) — infer from CSS flex-direction.
- <button> → Button { Text("...") }; secondary buttons → OutlinedButton.
- <input> → OutlinedTextField with var state hoisted via remember + mutableStateOf("").
- <h1>/<h2>/<h3> → Text(... style = MaterialTheme.typography.headlineLarge / Medium / Small).
- <p>, <span> → Text(... style = MaterialTheme.typography.bodyLarge / bodyMedium).
- <img> → Box(modifier = Modifier.size(...).background(Color(0xFFE5E7EB))) — placeholder.
- CSS color "#RRGGBB" → Color(0xFFRRGGBB).
- CSS padding/margin → Modifier.padding(<n>.dp).
- CSS width/height in px → Modifier.width(<n>.dp) / Modifier.height(<n>.dp).
- CSS gap → use Spacer(Modifier.height/width(<n>.dp)) between children, or
  Arrangement.spacedBy(<n>.dp).
- CSS background-color → Modifier.background(Color(...)) or Surface(color = ...).
- CSS border-radius → Modifier.clip(RoundedCornerShape(<n>.dp)) or set on Surface/Card.
- Bottom navigation → Scaffold + BottomAppBar.

🚨 CRITICAL API RULES — VIOLATIONS CAUSE COMPILE ERRORS 🚨

ICONS — only use these names with Icons.Default.<Name>:
  ArrowBack, ArrowForward, ArrowDownward, ArrowUpward, ArrowDropDown
  (THERE IS NO ArrowDropUp — use ArrowDropDown rotated, or KeyboardArrowUp)
  KeyboardArrowDown, KeyboardArrowUp, KeyboardArrowLeft, KeyboardArrowRight
  Add, Remove, Close, Done, Check, Clear, Edit, Delete, Save
  Menu, MoreVert, MoreHoriz, Search, Settings, Refresh, Share, Send
  Home, Person, AccountCircle, AccountBox, Lock, LockOpen
  Email, Phone, LocationOn, Place, Schedule, Today, DateRange
  Star, StarBorder, Favorite, FavoriteBorder, ThumbUp, ThumbDown
  Notifications, NotificationsActive, Visibility, VisibilityOff
  ShoppingCart, ShoppingBag, AttachMoney, Payment
  Image, Photo, PlayArrow, Pause, Stop, VolumeUp, VolumeOff
  Info, Warning, Error, HelpOutline
  KeyboardArrowDown, KeyboardArrowUp
If unsure, default to Icons.Default.Circle or omit the icon entirely.

ROUNDEDCORNERSHAPE — the constructor signature is one of:
  RoundedCornerShape(size: Dp)            // all four corners equal
  RoundedCornerShape(percent: Int)
  RoundedCornerShape(
      topStart = X.dp, topEnd = Y.dp,
      bottomEnd = Z.dp, bottomStart = W.dp,
  )                                        // PER-CORNER: use Start/End, NOT Left/Right
NEVER use 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' — those are
not parameter names in Compose's RoundedCornerShape.

CORNERSIZE vs SHAPE — when a Material3 component asks for a Shape (e.g.
Card(shape = ...)), pass a RoundedCornerShape directly. When a function
asks for CornerSize, wrap with CornerSize(8.dp). Do not mix them.

OUTLINEDTEXTFIELD — required parameters:
  OutlinedTextField(
      value = text,
      onValueChange = { text = it },
      label = { Text("...") },     // optional but recommended
      modifier = Modifier...,       // optional
  )
'text' must be a 'var' from remember { mutableStateOf("") }.

BUTTON — onClick is REQUIRED:
  Button(onClick = { /* TODO */ }) { Text("Label") }
Never call Button with no onClick parameter.

SPACER — pass dimensions via Modifier:
  Spacer(modifier = Modifier.height(8.dp))
  Spacer(modifier = Modifier.width(8.dp))

AESTHETIC RULES:
- Wrap the whole screen in Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background).
- Default outer padding: 16.dp.
- Use the design system's primary color where the HTML uses an accent color.

DO NOT:
- Use deprecated Material 1 components.
- Generate Activity classes, AndroidManifest entries, or Gradle config.
- Add comments or TODOs in the output.
- Wrap output in markdown.
- Invent icon names not listed above.
- Use 'topLeft' / 'topRight' / 'bottomLeft' / 'bottomRight' anywhere.

If you're uncertain about a complex element, fall back to a Text or Box
placeholder rather than producing invalid Kotlin.`

function userPromptFor(screen: ScreenForCodegen, ds: DesignSystemLite): string {
  const primary = ds?.colors?.primary?.base || '#3B82F6'
  const dsHint = `Design system primary color: ${primary}.`
  // Trim HTML to avoid blowing the context window — most relevant content is
  // the body markup, not the <head>/<style>.
  const html = screen.html.length > 16000 ? screen.html.slice(0, 16000) + '\n<!-- truncated -->' : screen.html
  return `${dsHint}

Screen name: "${screen.name}"

HTML:
${html}`
}

function stripFences(s: string): string {
  let out = s.trim()
  // Remove leading ```kotlin / ``` and trailing ```
  out = out.replace(/^```(?:kotlin|kt)?\s*\n?/i, '')
  out = out.replace(/```$/m, '').trim()
  // Remove any package/import lines the model snuck in.
  out = out
    .split('\n')
    .filter((l) => !/^\s*(?:package|import)\s+/.test(l))
    .join('\n')
    .trim()
  return out
}

// ─── public API ───────────────────────────────────────────────

export interface ScreenWithAsset extends ScreenForCodegen {
  pngPath?: string  // optional rendered screenshot — sent to Gemini as inline image
}

export async function generateAndroidScreens(
  apiKey: string,
  screens: ScreenWithAsset[],
  designSystem: DesignSystemLite | undefined,
  onProgress?: (msg: string) => void,
): Promise<KotlinScreen[]> {
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set')
  if (!fs.existsSync(KOTLIN_CACHE_DIR)) fs.mkdirSync(KOTLIN_CACHE_DIR, { recursive: true })

  const ds = designSystem || {}
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  const out: KotlinScreen[] = []
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i]
    const composableName = safeComposableName(s.name) || `Screen${i + 1}`
    // Hash includes prompt version + whether we used screenshot, so a
    // pipeline change automatically invalidates stale cache entries.
    const hash = sha1(`${PROMPT_VERSION}|img=${s.pngPath ? 1 : 0}|${s.html}`)
    const cachePath = path.join(KOTLIN_CACHE_DIR, `${hash}.kt`)

    if (fs.existsSync(cachePath)) {
      onProgress?.(`[${i + 1}/${screens.length}] ${composableName} — cached`)
      out.push({ composableName, composableBody: fs.readFileSync(cachePath, 'utf-8'), htmlHash: hash })
      continue
    }

    onProgress?.(`[${i + 1}/${screens.length}] ${composableName} — generating Kotlin (${s.pngPath ? 'multimodal' : 'text-only'})`)
    try {
      // Build multimodal parts: text prompt + screenshot (if available).
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: userPromptFor(s, ds) },
      ]
      if (s.pngPath && fs.existsSync(s.pngPath)) {
        const png = fs.readFileSync(s.pngPath)
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: png.toString('base64'),
          },
        })
        parts.push({ text: 'The image above is the rendered screenshot of the HTML — match its visual layout, colors, and spacing exactly.' })
      }
      const result = await model.generateContent(parts as any)
      const text = result.response.text()
      const body = stripFences(text)
      if (!body) throw new Error('Empty response from Gemini')
      fs.writeFileSync(cachePath, body, 'utf-8')
      out.push({ composableName, composableBody: body, htmlHash: hash })
    } catch (e: any) {
      onProgress?.(`[${i + 1}/${screens.length}] ${composableName} — FAILED, using fallback (${e?.message || e})`)
      const fallback = `Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("${composableName}", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(12.dp))
        Text(
            text = "AI codegen failed for this screen — please try Run again.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}`
      out.push({ composableName, composableBody: fallback, htmlHash: hash })
    }
  }
  return out
}

// ─── Kotlin file assembly ─────────────────────────────────────

export function buildScreensKotlinFile(packageName: string, screens: KotlinScreen[]): string {
  if (screens.length === 0) {
    return SCREENS_FILE_HEADER(packageName) + '\n@Composable\nfun ScreenRouter() {\n    Text("(no screens)")\n}\n'
  }

  const composables = screens.map((s) => `@Composable\nfun ${s.composableName}Screen() {\n${indent(s.composableBody, 4)}\n}`).join('\n\n')

  // Simple state-driven router: tabs at top, render selected screen below.
  const tabs = screens.map((s) => JSON.stringify(s.composableName)).join(', ')
  const calls = screens.map((s, i) => `        ${i} -> ${s.composableName}Screen()`).join('\n')

  const router = `@Composable
fun ScreenRouter() {
    var index by remember { mutableStateOf(0) }
    val labels = listOf(${tabs})
    Column(modifier = Modifier.fillMaxSize()) {
        if (labels.size > 1) {
            ScrollableTabRow(selectedTabIndex = index, edgePadding = 0.dp) {
                labels.forEachIndexed { i, label ->
                    Tab(selected = index == i, onClick = { index = i }) {
                        Text(text = label, modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp))
                    }
                }
            }
        }
        Box(modifier = Modifier.weight(1f)) {
            when (index) {
${calls}
                else -> ${screens[0].composableName}Screen()
            }
        }
    }
}`

  return SCREENS_FILE_HEADER(packageName) + '\n' + composables + '\n\n' + router + '\n'
}

function indent(s: string, n: number): string {
  const pad = ' '.repeat(n)
  return s.split('\n').map((l) => (l ? pad + l : l)).join('\n')
}

const SCREENS_FILE_HEADER = (packageName: string) => `package ${packageName}

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
`
