import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DesignGuide } from '../App'
import { generateDesignImages } from './image-gen'
import { designGuideDB } from './design-guide-db'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string

if (!API_KEY) {
  console.error(
    '[VibeSynth] VITE_GEMINI_API_KEY not found. ' +
    'Ensure .env file exists in project root with VITE_GEMINI_API_KEY=your_key'
  )
}

const genAI = new GoogleGenerativeAI(API_KEY || '')

// ─── Stitch-Quality System Prompt ───────────────────────────────

const SYSTEM_PROMPT = `You are VibeSynth, a premium AI design tool that generates production-quality mobile and web app UI designs as self-contained HTML+CSS.

Your designs must match the visual polish of Google Stitch — not wireframes, not prototypes, but FINISHED, production-ready UI screens that look like they came from a senior design team.

=== VISUAL QUALITY REQUIREMENTS ===

LAYOUT & SPACING:
- Use generous, intentional whitespace. Professional designs breathe.
- Follow an 8px grid system for all spacing (padding, margins, gaps).
- Mobile: max-width 390px with proper safe areas (status bar 44px, bottom nav ~80px).
- Cards should have 16-24px padding, 12-16px border-radius, subtle shadows.
- Section spacing: 24-32px between major sections, 12-16px between related items.

TYPOGRAPHY:
- Import Google Fonts via <style>@import url('https://fonts.googleapis.com/css2?family=...')</style>
- Use a clear 3-level type hierarchy: Display/Headline (24-32px bold), Body (14-16px regular), Caption/Label (11-13px medium).
- Set proper line-height: headings 1.2, body 1.5-1.6, captions 1.3.
- Use letter-spacing: headings -0.02em, body normal, uppercase labels 0.05em.
- Font weights: Bold (700) for headings, Regular (400) for body, Medium (500) for labels/buttons.

COLOR & DEPTH:
- Use a sophisticated color palette with primary, secondary, and neutral tones.
- Dark themes: use layered dark surfaces (not flat #000). Base #0a0a0a, cards #141414, elevated #1a1a1a.
- Light themes: use warm whites. Base #fafafa, cards #ffffff, subtle tints for sections.
- Accent colors should appear sparingly — for CTAs, active states, and key data.
- Shadows: use layered shadows for depth. Cards: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04).
- Use subtle gradients for hero sections and premium CTAs.

COMPONENTS:
- Buttons: proper padding (12px 24px), border-radius (8-12px), font-weight 600, hover states.
- Cards: background, border-radius 12-16px, proper shadows, content padding 16-20px.
- Bottom navigation: 5 items max, active state with filled icon + accent color, labels below icons.
- Status bar: 44px height, show time "9:41" left, signal/wifi/battery icons right.
- Search bars: rounded (24-28px radius), subtle background, search icon, placeholder text.
- Chips/Tags: pill-shaped, small padding (6px 12px), 10-12px font, contrasting background.
- List items: consistent row height (56-72px), left icon/avatar, title+subtitle, right action.
- Tab bars: clear active state (color + indicator), horizontal scroll if needed.

CONTENT:
- Use REALISTIC sample data — actual names, numbers, dates. Never "Lorem ipsum".
- For metrics/stats: show plausible numbers (e.g., "2,847 steps", "78% complete", "4.8 ★").
- For profiles: realistic names (e.g., "Sarah Chen", "Mike Rodriguez").
- For dates: use relative time ("2h ago", "Yesterday") or formatted dates ("Mar 15, 2025").
- Include proper empty states, loading patterns, and visual hierarchy.

IMAGES:
- When the design needs images, use DATA_URL PLACEHOLDERS in this exact format:
  <img src="{{HERO_IMAGE}}" alt="description" style="width:100%;height:200px;object-fit:cover;border-radius:12px;" />
  <img src="{{CONTENT_IMAGE_1}}" alt="description" style="..." />
  <img src="{{CONTENT_IMAGE_2}}" alt="description" style="..." />
- Available placeholders: {{HERO_IMAGE}}, {{CONTENT_IMAGE_1}}, {{CONTENT_IMAGE_2}}
- These will be replaced with AI-generated images by the system.
- For small icons/avatars: use inline SVG or CSS-styled divs with initials.
- For user avatars: use colored circles with initials (e.g., "SC" for Sarah Chen).

ICONS:
- Use inline SVG icons. Material Design style: 24x24, 2px stroke, rounded linecap.
- Common icons to include: home, search, user/person, settings, heart, star, arrow, menu, plus, bell.
- Keep SVGs simple and clean — no complex paths.

=== OUTPUT FORMAT ===
- Return ONLY valid HTML. No markdown, no code fences, no explanation text.
- All styles in a <style> tag or inline. NO external CSS except Google Fonts @import.
- Start with <!DOCTYPE html> or <html>.
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">.`

// ─── Design Guide Formatter ─────────────────────────────────────

function formatGuideForPrompt(guide: DesignGuide): string {
  return `=== DESIGN GUIDE (follow these rules strictly) ===

OVERVIEW: ${guide.overview}

COLOR RULES: ${guide.colorRules}

TYPOGRAPHY RULES: ${guide.typographyRules}

ELEVATION & DEPTH: ${guide.elevationRules}

COMPONENT RULES: ${guide.componentRules}

DO'S AND DON'TS: ${guide.dosAndDonts}

=== END DESIGN GUIDE ===`
}

// ─── Image Placeholder Replacement ──────────────────────────────

function replaceImagePlaceholders(html: string, images: Map<string, string>): string {
  let result = html
  for (const [key, dataUrl] of images) {
    result = result.split(`{{${key}}}`).join(dataUrl)
  }
  // Replace any remaining unfilled placeholders with gradient fallbacks
  result = result.replace(/\{\{HERO_IMAGE\}\}/g, 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6366f1"/><stop offset="100%" style="stop-color:#8b5cf6"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/></svg>'
  ))
  result = result.replace(/\{\{CONTENT_IMAGE_\d+\}\}/g, 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#374151"/><stop offset="100%" style="stop-color:#6b7280"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/></svg>'
  ))
  return result
}

// ─── Public API ─────────────────────────────────────────────────

export interface GenerateDesignResult {
  html: string
  screenName: string
}

export interface GenerationCallbacks {
  onImageGenStart?: () => void
  onImageGenComplete?: (count: number) => void
  onDesignGenStart?: () => void
  onDesignGenComplete?: () => void
}

export async function generateDesign(
  prompt: string,
  deviceType: 'app' | 'web' | 'tablet' = 'app',
  guide?: DesignGuide,
  callbacks?: GenerationCallbacks,
): Promise<GenerateDesignResult[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  // Auto-match design guide from DB if none provided
  const activeGuide = guide || designGuideDB.findBestMatch(prompt)?.guide

  // Step 1: Generate images in parallel with design
  callbacks?.onImageGenStart?.()
  const imagePromise = generateDesignImages(prompt, deviceType).catch((err) => {
    console.warn('[VibeSynth] Image generation failed, using fallbacks:', err)
    return new Map<string, string>()
  })

  // Step 2: Generate the HTML design
  callbacks?.onDesignGenStart?.()

  const deviceContext = deviceType === 'app'
    ? 'Design a native mobile app screen (390px width, mobile viewport with status bar and bottom navigation).'
    : deviceType === 'tablet'
    ? 'Design a tablet app screen (1024px width, portrait tablet viewport like iPad Pro).'
    : 'Design a desktop web page (full width, responsive layout with proper header/navigation).'

  const guideContext = activeGuide
    ? `\n\n${formatGuideForPrompt(activeGuide)}\n\nYou MUST follow the design guide above when choosing colors, typography, elevation, components, and overall visual style.`
    : ''

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `${deviceContext}${guideContext}\n\nUser request: ${prompt}\n\nGenerate a single complete, production-quality screen. Use the image placeholders {{HERO_IMAGE}}, {{CONTENT_IMAGE_1}}, {{CONTENT_IMAGE_2}} where photos should appear. Include realistic content, proper component styling, and polished visual hierarchy.`,
  ])
  callbacks?.onDesignGenComplete?.()

  const text = result.response.text()

  // Extract HTML
  let html = text.trim()
  if (html.startsWith('```html')) html = html.slice(7)
  else if (html.startsWith('```')) html = html.slice(3)
  if (html.endsWith('```')) html = html.slice(0, -3)
  html = html.trim()

  // Step 3: Replace image placeholders with generated images
  const images = await imagePromise
  callbacks?.onImageGenComplete?.(images.size)
  html = replaceImagePlaceholders(html, images)

  const screenName = deriveScreenName(prompt)
  return [{ html, screenName }]
}

/**
 * Generate multiple screens for a single app at once.
 * Each screen is a different page/route of the same app, sharing the same design system.
 */
export async function generateMultiScreen(
  appDescription: string,
  screenNames: string[],
  deviceType: 'app' | 'web' | 'tablet' = 'app',
  guide?: DesignGuide,
  callbacks?: GenerationCallbacks & {
    onScreenComplete?: (index: number, total: number, name: string) => void
  },
): Promise<GenerateDesignResult[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const activeGuide = guide || designGuideDB.findBestMatch(appDescription)?.guide

  // Generate shared images once
  callbacks?.onImageGenStart?.()
  const imagePromise = generateDesignImages(appDescription, deviceType).catch(() => new Map<string, string>())

  const deviceContext = deviceType === 'app'
    ? 'Design a native mobile app screen (390px width, mobile viewport with status bar and bottom navigation).'
    : deviceType === 'tablet'
    ? 'Design a tablet app screen (1024px width, portrait tablet viewport like iPad Pro).'
    : 'Design a desktop web page (full width, responsive layout with proper header/navigation).'

  const guideContext = activeGuide
    ? `\n\n${formatGuideForPrompt(activeGuide)}\n\nYou MUST follow the design guide above.`
    : ''

  const images = await imagePromise
  callbacks?.onImageGenComplete?.(images.size)

  // Generate each screen sequentially to maintain design consistency
  callbacks?.onDesignGenStart?.()
  const results: GenerateDesignResult[] = []

  for (let i = 0; i < screenNames.length; i++) {
    const screenName = screenNames[i]

    // Build context from previously generated screens for consistency
    const prevScreenContext = results.length > 0
      ? `\n\nYou have already designed these screens for the SAME app (maintain identical design system, colors, typography, navigation, and component styles):\n${results.map(r => `- ${r.screenName}`).join('\n')}\n\nThe new screen must look like it belongs to the same app.`
      : ''

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `${deviceContext}${guideContext}${prevScreenContext}\n\nApp description: ${appDescription}\n\nGenerate the "${screenName}" screen/page of this app. Use image placeholders {{HERO_IMAGE}}, {{CONTENT_IMAGE_1}}, {{CONTENT_IMAGE_2}} where photos should appear. Include realistic content specific to this screen.`,
    ])

    let html = result.response.text().trim()
    if (html.startsWith('```html')) html = html.slice(7)
    else if (html.startsWith('```')) html = html.slice(3)
    if (html.endsWith('```')) html = html.slice(0, -3)
    html = replaceImagePlaceholders(html.trim(), images)

    results.push({ html, screenName })
    callbacks?.onScreenComplete?.(i + 1, screenNames.length, screenName)
  }

  callbacks?.onDesignGenComplete?.()
  return results
}

export async function editDesign(
  currentHtml: string,
  editPrompt: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  // Extract images from current HTML to re-inject after edit
  const imageMap = new Map<string, string>()
  let placeholder = 0
  const strippedHtml = currentHtml.replace(/data:[^"')\s]{200,}/g, (match) => {
    const key = `__IMG_${placeholder++}__`
    imageMap.set(key, match)
    return key
  })

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `Here is the current design HTML:\n\n${strippedHtml}\n\nUser wants to modify it: "${editPrompt}"\n\nReturn the COMPLETE modified HTML. Apply the requested changes while keeping the overall design intact. Keep all image placeholders like __IMG_0__, __IMG_1__ exactly as they are.`,
  ])

  let html = result.response.text().trim()
  if (html.startsWith('```html')) html = html.slice(7)
  else if (html.startsWith('```')) html = html.slice(3)
  if (html.endsWith('```')) html = html.slice(0, -3)
  html = html.trim()

  // Re-inject original images
  for (const [key, dataUrl] of imageMap) {
    html = html.split(key).join(dataUrl)
  }

  return html
}

/**
 * Strip base64 data URLs and large inline content from HTML
 * to reduce token count before sending to Gemini for analysis.
 */
function stripHeavyContent(html: string): string {
  // Replace base64 data URLs with placeholder text
  let stripped = html.replace(/data:[^"')\s]+/g, 'data:image/placeholder')
  // Remove any remaining very long attribute values (>200 chars)
  stripped = stripped.replace(/="[^"]{200,}"/g, '="[large-value-removed]"')
  return stripped
}

export async function generateDesignSystem(html: string, baseGuide?: DesignGuide): Promise<{
  colors: {
    primary: { base: string; tones: string[] }
    secondary: { base: string; tones: string[] }
    tertiary: { base: string; tones: string[] }
    neutral: { base: string; tones: string[] }
  }
  typography: {
    headline: { family: string }
    body: { family: string }
    label: { family: string }
  }
  name: string
  guide: DesignGuide
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const guideRef = baseGuide
    ? `\n\nUse the following as a reference design guide to adapt for this specific design:\n${formatGuideForPrompt(baseGuide)}`
    : ''

  const result = await model.generateContent([
    `Analyze this HTML design and extract a design system. Return ONLY valid JSON with this exact structure:
{
  "name": "Theme Name",
  "colors": {
    "primary": { "base": "#HEX", "tones": ["#000000", "#T10", "#T20", "#T30", "#T40", "#T50", "#T60", "#T70", "#T80", "#T90", "#T95", "#ffffff"] },
    "secondary": { "base": "#HEX", "tones": [...12 tones...] },
    "tertiary": { "base": "#HEX", "tones": [...12 tones...] },
    "neutral": { "base": "#HEX", "tones": [...12 tones...] }
  },
  "typography": {
    "headline": { "family": "Font Name" },
    "body": { "family": "Font Name" },
    "label": { "family": "Font Name" }
  },
  "guide": {
    "overview": "A 2-3 sentence creative north star describing this design's visual philosophy and aesthetic goals.",
    "colorRules": "Specific rules for how colors should be used in this design system — surface hierarchy, accent usage, gradient rules.",
    "typographyRules": "Typography scale, font usage rules, hierarchy definitions.",
    "elevationRules": "How depth and elevation are expressed — shadows, layering, borders.",
    "componentRules": "Button styles, input patterns, chip/tag styles, card behaviors specific to this design.",
    "dosAndDonts": "3 DO rules and 3 DON'T rules specific to maintaining this design's visual language."
  }
}

The tones should be: T0 (darkest/black), T10, T20, T30, T40, T50, T60 (base area), T70, T80, T90, T95, T100 (lightest/white).
Generate appropriate tonal variations for each color role.
The guide should be a practical, opinionated design guide tailored to the specific visual style of this HTML design.${guideRef}
Return ONLY the JSON, no other text.`,
    stripHeavyContent(html),
  ])

  let json = result.response.text().trim()
  if (json.startsWith('```json')) json = json.slice(7)
  else if (json.startsWith('```')) json = json.slice(3)
  if (json.endsWith('```')) json = json.slice(0, -3)

  return JSON.parse(json.trim())
}

function deriveScreenName(prompt: string): string {
  const words = prompt.split(/\s+/).slice(0, 4)
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}
