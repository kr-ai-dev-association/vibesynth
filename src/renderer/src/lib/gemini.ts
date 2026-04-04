import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DesignGuide, DesignSystem } from '../App'
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

CONTENT DENSITY:
- Mobile apps (390px): content should fit within one screen viewport (~844px). Header + main content + bottom nav. No excessive scrolling sections.
- Tablet apps: content should fit within 1-2 viewports. Do not pad with empty sections.
- Desktop/web: content CAN be long (landing pages, dashboards). But avoid redundant repeated sections or filler content.
- Show ONLY meaningful, purpose-driven UI elements. Do NOT add decorative padding sections or duplicate similar components.
- Every section must have a clear purpose — if you can't name what the section does, don't include it.

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

function formatDesignSystemTokens(ds: DesignSystem): string {
  const lines: string[] = [
    '╔══════════════════════════════════════════════════════════╗',
    '║  MANDATORY DESIGN SYSTEM — YOU MUST USE THESE EXACT     ║',
    '║  COLORS AND FONTS. DO NOT SUBSTITUTE OR CHANGE THEM.    ║',
    '╚══════════════════════════════════════════════════════════╝',
    '',
    `Theme Name: "${ds.name}"`,
    `Color Scheme: ${ds.colorScheme || 'auto'} ${ds.colorScheme === 'dark' ? '— USE DARK BACKGROUNDS (#0a0a0a, #111, #1a1a2e). White/light text.' : ds.colorScheme === 'light' ? '— USE LIGHT BACKGROUNDS (#ffffff, #fafafa, #f5f5f5). Dark text.' : '— AI decides based on prompt context.'}`,
    '',
    `PRIMARY COLOR: ${ds.colors.primary.base} — Use for CTAs, active states, key accents`,
    `SECONDARY COLOR: ${ds.colors.secondary.base} — Use for secondary elements, badges`,
    `TERTIARY COLOR: ${ds.colors.tertiary.base} — Use for highlights, links`,
    `NEUTRAL COLOR: ${ds.colors.neutral.base} — Use for backgrounds, borders, text`,
    '',
    `HEADLINE FONT: font-family: '${ds.typography.headline.family}' — Import from Google Fonts`,
    `  Size: ${ds.typography.headline.size || '32px'}, Weight: ${ds.typography.headline.weight || '700'}`,
    `BODY FONT: font-family: '${ds.typography.body.family}'`,
    `  Size: ${ds.typography.body.size || '16px'}, Weight: ${ds.typography.body.weight || '400'}`,
    `LABEL FONT: font-family: '${ds.typography.label.family}'`,
    `  Size: ${ds.typography.label.size || '12px'}, Weight: ${ds.typography.label.weight || '500'}`,
  ]
  if (ds.components) {
    lines.push(
      '',
      'COMPONENT STYLES:',
      `  Button: border-radius: ${ds.components.buttonRadius}; padding: ${ds.components.buttonPadding}; font-weight: ${ds.components.buttonFontWeight};`,
      `  Input: border-radius: ${ds.components.inputRadius}; border: ${ds.components.inputBorder}; background: ${ds.components.inputBg}; padding: ${ds.components.inputPadding};`,
      `  Card: border-radius: ${ds.components.cardRadius}; box-shadow: ${ds.components.cardShadow}; padding: ${ds.components.cardPadding};`,
      `  Chip: border-radius: ${ds.components.chipRadius}; padding: ${ds.components.chipPadding}; background: ${ds.components.chipBg};`,
    )
  }
  lines.push(
    '',
    'CRITICAL: The primary color MUST appear in the generated HTML as a hex code.',
    `Every CTA button must use background-color: ${ds.colors.primary.base};`,
    `The @import for Google Fonts must include '${ds.typography.headline.family}'.`,
    '══════════════════════════════════════════════════════════',
  )
  return lines.join('\n')
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
  existingScreenHtml?: string,
  presetDesignSystem?: DesignSystem,
): Promise<GenerateDesignResult[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const activeGuide = guide || designGuideDB.findBestMatch(prompt)?.guide

  callbacks?.onImageGenStart?.()
  const imagePromise = generateDesignImages(prompt, deviceType).catch((err) => {
    console.warn('[VibeSynth] Image generation failed, using fallbacks:', err)
    return new Map<string, string>()
  })

  callbacks?.onDesignGenStart?.()

  const deviceContext = deviceType === 'app'
    ? 'Design a native mobile app screen (390px width, mobile viewport with status bar and bottom navigation).'
    : deviceType === 'tablet'
    ? 'Design a tablet app screen (1024px width, portrait tablet viewport like iPad Pro).'
    : 'Design a desktop web page (full width, responsive layout with proper header/navigation). IMPORTANT: Do NOT use height:100vh or any fixed height on the body, html, or any main wrapper element. Let the page height grow naturally based on content. Use min-height:100vh only if you need to ensure a minimum full-screen look. The page must scroll if content is long.'

  const guideContext = activeGuide
    ? `\n\n${formatGuideForPrompt(activeGuide)}\n\nYou MUST follow the design guide above when choosing colors, typography, elevation, components, and overall visual style.`
    : ''

  const presetTokenContext = presetDesignSystem
    ? `\n\n${formatDesignSystemTokens(presetDesignSystem)}\n\nYou MUST use the exact color hex codes, font families, and component CSS values listed above.`
    : ''

  // If the project already has screens, enforce design consistency
  let consistencyContext = ''
  if (existingScreenHtml) {
    const tokens = extractDesignTokens(existingScreenHtml)
    const stripped = stripHeavyContent(existingScreenHtml)
    const ref = stripped.length > 6000 ? stripped.slice(0, 6000) + '\n<!-- truncated -->' : stripped
    consistencyContext = `

=== DESIGN CONSISTENCY — MATCH EXISTING APP ===
This new screen is being added to an existing app. You MUST match the visual design system exactly.

DESIGN TOKENS:
${tokens}

REFERENCE SCREEN HTML:
${ref}

Use the EXACT same colors, fonts, border-radius, shadows, navigation style, and component styles.
=== END CONSISTENCY ===`
  }

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `${deviceContext}${guideContext}${presetTokenContext}${consistencyContext}\n\nUser request: ${prompt}\n\nGenerate a single complete, production-quality screen. Use the image placeholders {{HERO_IMAGE}}, {{CONTENT_IMAGE_1}}, {{CONTENT_IMAGE_2}} where photos should appear. Include realistic content, proper component styling, and polished visual hierarchy.`,
  ])
  callbacks?.onDesignGenComplete?.()

  const text = result.response.text()

  let html = text.trim()
  if (html.startsWith('```html')) html = html.slice(7)
  else if (html.startsWith('```')) html = html.slice(3)
  if (html.endsWith('```')) html = html.slice(0, -3)
  html = html.trim()

  const images = await imagePromise
  callbacks?.onImageGenComplete?.(images.size)
  html = replaceImagePlaceholders(html, images)

  const screenName = deriveScreenName(prompt)
  return [{ html, screenName }]
}

/**
 * Extract concrete design tokens (colors, fonts, key CSS) from generated HTML
 * so subsequent screens can replicate the exact same visual system.
 */
function extractDesignTokens(html: string): string {
  const tokens: string[] = []

  // Extract color hex codes
  const colorSet = new Set<string>()
  const hexMatches = html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)
  for (const m of hexMatches) colorSet.add(m[0].toLowerCase())
  if (colorSet.size > 0) {
    tokens.push(`EXACT COLORS USED: ${[...colorSet].join(', ')}`)
  }

  // Extract rgb/rgba colors
  const rgbMatches = html.matchAll(/rgba?\([^)]+\)/g)
  const rgbSet = new Set<string>()
  for (const m of rgbMatches) rgbSet.add(m[0])
  if (rgbSet.size > 0) {
    tokens.push(`RGB COLORS: ${[...rgbSet].slice(0, 15).join(', ')}`)
  }

  // Extract Google Fonts imports
  const fontImports = html.matchAll(/@import\s+url\(['"]([^'"]+)['"]\)/g)
  for (const m of fontImports) tokens.push(`FONT IMPORT: ${m[0]}`)

  // Extract font-family declarations
  const fontFamilies = new Set<string>()
  const ffMatches = html.matchAll(/font-family\s*:\s*['"]?([^;'"}\n]+)/g)
  for (const m of ffMatches) fontFamilies.add(m[1].trim())
  if (fontFamilies.size > 0) {
    tokens.push(`FONT FAMILIES: ${[...fontFamilies].join(', ')}`)
  }

  // Extract border-radius patterns
  const radiusSet = new Set<string>()
  const brMatches = html.matchAll(/border-radius\s*:\s*([^;}\n]+)/g)
  for (const m of brMatches) radiusSet.add(m[1].trim())
  if (radiusSet.size > 0) {
    tokens.push(`BORDER RADIUS: ${[...radiusSet].join(', ')}`)
  }

  // Extract box-shadow patterns
  const shadowSet = new Set<string>()
  const bsMatches = html.matchAll(/box-shadow\s*:\s*([^;}\n]+)/g)
  for (const m of bsMatches) shadowSet.add(m[1].trim())
  if (shadowSet.size > 0) {
    tokens.push(`BOX SHADOWS: ${[...shadowSet].join('; ')}`)
  }

  // Extract the full <style> block as the definitive reference
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  if (styleMatch) {
    const css = styleMatch[1].trim()
    if (css.length < 3000) {
      tokens.push(`FULL CSS STYLESHEET:\n${css}`)
    } else {
      tokens.push(`CSS STYLESHEET (first 3000 chars):\n${css.slice(0, 3000)}`)
    }
  }

  return tokens.join('\n')
}

/**
 * Generate multiple screens for a single app at once.
 * Each screen is a different page/route of the same app, sharing the same design system.
 *
 * Design consistency is enforced by:
 * 1. Extracting concrete design tokens (colors, fonts, CSS) from the first screen
 * 2. Passing those tokens + the first screen's full HTML as reference for all subsequent screens
 */
export async function generateMultiScreen(
  appDescription: string,
  screenNames: string[],
  deviceType: 'app' | 'web' | 'tablet' = 'app',
  guide?: DesignGuide,
  callbacks?: GenerationCallbacks & {
    onScreenComplete?: (index: number, total: number, name: string, html: string) => void
  },
  presetDesignSystem?: DesignSystem,
): Promise<GenerateDesignResult[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
  const activeGuide = guide || designGuideDB.findBestMatch(appDescription)?.guide

  // Generate shared images once
  callbacks?.onImageGenStart?.()
  const imagePromise = generateDesignImages(appDescription, deviceType).catch(() => new Map<string, string>())

  const deviceContext = deviceType === 'app'
    ? 'Design a native mobile app screen (390px width, mobile viewport with status bar and bottom navigation).'
    : deviceType === 'tablet'
    ? 'Design a tablet app screen (1024px width, portrait tablet viewport like iPad Pro).'
    : 'Design a desktop web page (full width, responsive layout with proper header/navigation). IMPORTANT: Do NOT use height:100vh or any fixed height on the body, html, or any main wrapper element. Let the page height grow naturally based on content. Use min-height:100vh only if you need to ensure a minimum full-screen look.'

  const guideContext = activeGuide
    ? `\n\n${formatGuideForPrompt(activeGuide)}\n\nYou MUST follow the design guide above.`
    : ''

  const presetTokenContext = presetDesignSystem
    ? `\n\n${formatDesignSystemTokens(presetDesignSystem)}\n\nYou MUST use the exact color hex codes, font families, and component CSS values listed above.`
    : ''

  const images = await imagePromise
  callbacks?.onImageGenComplete?.(images.size)

  callbacks?.onDesignGenStart?.()
  const results: GenerateDesignResult[] = []
  let designTokens = ''
  let referenceHtml = ''

  for (let i = 0; i < screenNames.length; i++) {
    const screenName = screenNames[i]

    let consistencyContext = ''
    if (i === 0) {
      consistencyContext = `\n\nThis is the FIRST screen of a ${screenNames.length}-screen app. The other screens are: ${screenNames.slice(1).join(', ')}. Establish a clear, consistent visual design system (colors, typography, spacing, component styles, navigation) that ALL screens will share.`
    } else {
      consistencyContext = `

=== MANDATORY DESIGN CONSISTENCY ===
You are generating screen ${i + 1} of ${screenNames.length} for the SAME app.
You MUST replicate the EXACT same visual design system as the reference screen below.

DESIGN TOKENS FROM REFERENCE:
${designTokens}

REFERENCE SCREEN HTML ("${results[0].screenName}"):
${referenceHtml}

CRITICAL RULES:
- Use the EXACT SAME color palette — same hex codes, same accent colors, same backgrounds
- Use the EXACT SAME fonts — same @import, same font-family, same sizes/weights
- Use the EXACT SAME component styles — same border-radius, shadows, padding, card styles
- Use the EXACT SAME navigation bar/header design
- The screens must look like they are from the SAME app, just different pages
- Do NOT invent new colors, fonts, or component styles
=== END CONSISTENCY RULES ===`
    }

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `${deviceContext}${guideContext}${presetTokenContext}${consistencyContext}\n\nApp description: ${appDescription}\n\nGenerate the "${screenName}" screen/page. Use image placeholders {{HERO_IMAGE}}, {{CONTENT_IMAGE_1}}, {{CONTENT_IMAGE_2}} where photos should appear. Include realistic content specific to this screen.`,
    ])

    let html = result.response.text().trim()
    if (html.startsWith('```html')) html = html.slice(7)
    else if (html.startsWith('```')) html = html.slice(3)
    if (html.endsWith('```')) html = html.slice(0, -3)
    html = replaceImagePlaceholders(html.trim(), images)

    // After generating the first screen, extract tokens for consistency enforcement
    if (i === 0) {
      designTokens = extractDesignTokens(html)
      const stripped = stripHeavyContent(html)
      referenceHtml = stripped.length > 6000 ? stripped.slice(0, 6000) + '\n<!-- truncated -->' : stripped
    }

    results.push({ html, screenName })
    callbacks?.onScreenComplete?.(i + 1, screenNames.length, screenName, html)
  }

  callbacks?.onDesignGenComplete?.()
  return results
}

export async function editDesign(
  currentHtml: string,
  editPrompt: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

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
 * Edit a specific element within a design, identified by its CSS selector path.
 * Only the targeted element (and its children) should change; the rest of the page stays intact.
 */
export async function editDesignElement(
  currentHtml: string,
  cssPath: string,
  elementOuterHtml: string,
  editPrompt: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const imageMap = new Map<string, string>()
  let placeholder = 0
  const strippedHtml = currentHtml.replace(/data:[^"')\s]{200,}/g, (match) => {
    const key = `__IMG_${placeholder++}__`
    imageMap.set(key, match)
    return key
  })

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `Here is the current design HTML:\n\n${strippedHtml}\n\n` +
    `The user has selected a specific element using CSS path: "${cssPath}"\n` +
    `The selected element's HTML is:\n${elementOuterHtml}\n\n` +
    `User wants to modify ONLY this element: "${editPrompt}"\n\n` +
    `Rules:\n` +
    `1. Return the COMPLETE page HTML with the modification applied.\n` +
    `2. ONLY change the targeted element and its children. Do NOT change anything else.\n` +
    `3. Keep the overall page structure, other elements, and styling intact.\n` +
    `4. Keep all image placeholders like __IMG_0__, __IMG_1__ exactly as they are.\n` +
    `5. Return ONLY valid HTML. No markdown, no code fences.`,
  ])

  let html = result.response.text().trim()
  if (html.startsWith('```html')) html = html.slice(7)
  else if (html.startsWith('```')) html = html.slice(3)
  if (html.endsWith('```')) html = html.slice(0, -3)
  html = html.trim()

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
    headline: { family: string; size?: string; weight?: string; lineHeight?: string }
    body: { family: string; size?: string; weight?: string; lineHeight?: string }
    label: { family: string; size?: string; weight?: string; lineHeight?: string }
  }
  components?: {
    buttonRadius: string; buttonPadding: string; buttonFontWeight: string
    inputRadius: string; inputBorder: string; inputPadding: string; inputBg: string
    cardRadius: string; cardShadow: string; cardPadding: string
    chipRadius: string; chipPadding: string; chipBg: string
    fabSize: string; fabRadius: string
  }
  name: string
  guide: DesignGuide
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

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
    "headline": { "family": "Font Name", "size": "32px", "weight": "700", "lineHeight": "1.2" },
    "body": { "family": "Font Name", "size": "16px", "weight": "400", "lineHeight": "1.5" },
    "label": { "family": "Font Name", "size": "12px", "weight": "500", "lineHeight": "1.4" }
  },
  "components": {
    "buttonRadius": "8px",
    "buttonPadding": "10px 20px",
    "buttonFontWeight": "600",
    "inputRadius": "8px",
    "inputBorder": "1px solid #ccc",
    "inputPadding": "10px 14px",
    "inputBg": "#ffffff",
    "cardRadius": "12px",
    "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
    "cardPadding": "20px",
    "chipRadius": "9999px",
    "chipPadding": "4px 12px",
    "chipBg": "#f0f0f0",
    "fabSize": "56px",
    "fabRadius": "16px"
  },
  "guide": {
    "overview": "A 2-3 sentence creative north star.",
    "colorRules": "Color usage rules — surface hierarchy, accent usage, gradient rules.",
    "typographyRules": "Typography scale, font usage rules, hierarchy.",
    "elevationRules": "Shadows, layering, borders.",
    "componentRules": "Button styles, input patterns, chip/tag styles, card behaviors.",
    "dosAndDonts": "3 DO rules and 3 DON'T rules."
  }
}

Extract exact CSS values from the HTML. The tones: T0 (darkest) to T100 (lightest), 12 entries.
The components object must contain exact CSS values observed in the design.${guideRef}
Return ONLY the JSON, no other text.`,
    stripHeavyContent(html),
  ])

  let json = result.response.text().trim()
  if (json.startsWith('```json')) json = json.slice(7)
  else if (json.startsWith('```')) json = json.slice(3)
  if (json.endsWith('```')) json = json.slice(0, -3)

  return JSON.parse(json.trim())
}

/**
 * Predict which UI elements will attract the most user attention/clicks.
 * Returns zones with cssPath, intensity (0-1), label, and reason.
 */
export async function generateHeatmap(
  html: string,
): Promise<{ cssPath: string; tagName: string; label: string; intensity: number; reason: string }[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const result = await model.generateContent([
    `You are a UX analytics expert. Analyze this HTML UI and predict where users will focus their attention and clicks.

For each high-interest element, provide:
- cssPath: a CSS selector path to identify the element (use tag names, classes, nth-of-type)
- tagName: the HTML tag name (lowercase)
- label: a short human-readable label like "Primary CTA", "Navigation Menu", "Hero Image"
- intensity: a number from 0.0 to 1.0 where 1.0 = highest predicted attention
- reason: brief explanation of why this area attracts attention

Identify 5-10 zones covering buttons, headings, images, navigation, forms, and interactive elements.
Prioritize: CTAs > Navigation > Hero content > Secondary content > Footer.

Return ONLY valid JSON array. No markdown, no code fences.
Example: [{"cssPath":"body > header > nav","tagName":"nav","label":"Main Navigation","intensity":0.85,"reason":"Primary navigation bar — users scan this first"}]`,
    stripHeavyContent(html),
  ])

  let json = result.response.text().trim()
  if (json.startsWith('```json')) json = json.slice(7)
  else if (json.startsWith('```')) json = json.slice(3)
  if (json.endsWith('```')) json = json.slice(0, -3)

  const zones = JSON.parse(json.trim())
  return Array.isArray(zones) ? zones : []
}

/**
 * Generate a complete React + Vite + React Router project from multiple screen HTML designs.
 * Returns a file map (path -> content) ready to be written to disk.
 */
/**
 * Build a React+Vite+Tailwind frontend project from HTML screens.
 *
 * Architecture (improved):
 * 1. Generate fixed scaffolding files (package.json, vite.config.ts, etc.)
 * 2. Copy each screen's HTML into src/pages/{Name}.html for reference
 * 3. Ask Gemini ONLY to convert HTML→TSX page components + App.tsx routing
 * 4. Caller (Editor) then: scaffold → npm install → vite dev → browser popup
 */
export async function generateFrontendApp(
  screens: { name: string; html: string }[],
  deviceType: 'app' | 'web' | 'tablet' = 'web',
  prd?: string,
  designSystem?: { name: string; colors: any; typography: any; components?: any },
): Promise<Record<string, string>> {
  const routes = screens.map((s, i) => ({
    name: s.name,
    component: s.name.replace(/[^a-zA-Z0-9]/g, ''),
    route: i === 0 ? '/' : `/${slugify(s.name)}`,
  }))

  // ─── Step 1: Fixed scaffolding (no Gemini needed) ───
  const files: Record<string, string> = {}

  files['package.json'] = JSON.stringify({
    name: 'vibesynth-app',
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'react-router-dom': '^7.5.0',
    },
    devDependencies: {
      '@types/react': '^18.3.18',
      '@types/react-dom': '^18.3.5',
      '@vitejs/plugin-react': '^4.4.1',
      autoprefixer: '^10.4.21',
      postcss: '^8.5.3',
      tailwindcss: '^4.1.3',
      '@tailwindcss/vite': '^4.1.3',
      typescript: '^5.8.3',
      vite: '^6.3.1',
    },
  }, null, 2)

  files['vite.config.ts'] = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})`

  files['tsconfig.json'] = JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      isolatedModules: true,
      moduleDetection: 'force',
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
    },
    include: ['src'],
  }, null, 2)

  files['index.html'] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VibeSynth App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`

  files['src/main.tsx'] = `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)`

  files['src/vite-env.d.ts'] = `/// <reference types="vite/client" />`

  // ─── Step 2: Copy HTML screens as reference files ───
  for (const screen of screens) {
    const component = screen.name.replace(/[^a-zA-Z0-9]/g, '')
    files[`src/pages/${component}.ref.html`] = screen.html
  }

  // ─── Step 3: Gemini converts HTML→TSX pages + App.tsx + index.css ───
  // Note: some preview models may not support responseMimeType: 'application/json'
  // so we request JSON in the prompt and parse manually
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const screenSummaries = screens.map((s, i) => {
    const stripped = stripHeavyContent(s.html)
    const truncated = stripped.length > 12000 ? stripped.slice(0, 12000) + '\n<!-- truncated -->' : stripped
    return `Screen ${i + 1}: "${s.name}" (route: ${routes[i].route}, component: ${routes[i].component})\n<html>\n${truncated}\n</html>`
  }).join('\n\n')

  const prdContext = prd ? `\n\nPRD (Product Requirements):\n${prd.slice(0, 3000)}` : ''

  // Build design system context for Gemini
  let dsContext = ''
  if (designSystem) {
    const colors = designSystem.colors
    const typo = designSystem.typography
    dsContext = `\n\nDESIGN SYSTEM "${designSystem.name}" (MUST follow these tokens):
Colors:
  Primary: ${colors?.primary?.base || 'auto'}
  Secondary: ${colors?.secondary?.base || 'auto'}
  Tertiary: ${colors?.tertiary?.base || 'auto'}
  Neutral: ${colors?.neutral?.base || 'auto'}
Typography:
  Headline: ${typo?.headline?.family || 'auto'} ${typo?.headline?.size || ''} ${typo?.headline?.weight || ''}
  Body: ${typo?.body?.family || 'auto'} ${typo?.body?.size || ''} ${typo?.body?.weight || ''}
  Label: ${typo?.label?.family || 'auto'} ${typo?.label?.size || ''} ${typo?.label?.weight || ''}
${designSystem.components ? `Components: ${JSON.stringify(designSystem.components)}` : ''}`
  }

  const result = await model.generateContent([
    `You are converting ${screens.length} HTML design screens into React TSX page components for a Vite + React Router + Tailwind CSS project.

The project scaffolding (package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx) is ALREADY created.
IMPORTANT: src/main.tsx ALREADY wraps the app in <BrowserRouter>. Do NOT add another Router in App.tsx.

You only need to generate:
1. src/App.tsx — React Router <Routes> wiring all pages (NO <BrowserRouter> — it's in main.tsx)
2. src/index.css — Tailwind CSS import + shared styles + Google Font imports
3. One src/pages/{ComponentName}.tsx per screen

Routes: ${JSON.stringify(routes)}
Device type: ${deviceType}${prdContext}${dsContext}

RULES:
- CRITICAL: App.tsx must NOT import or use BrowserRouter/Router. Only use <Routes> and <Route>.
- Convert HTML to React TSX: class→className, inline style strings→React style objects or Tailwind classes
- Keep ALL visual design: colors, fonts, spacing, shadows, gradients, border-radius
- Use Tailwind CSS utility classes where possible, inline styles for complex values
- Wire navigation elements to React Router <Link> or useNavigate()
- Replace data:image/... base64 URLs with gradient placeholder divs
- src/index.css MUST start with: @import "tailwindcss";
- Include Google Fonts @import in index.css if the HTML uses custom fonts
- Each page component: export default function ComponentName() { return (...) }
- Do NOT generate package.json, vite.config.ts, tsconfig.json, index.html, or main.tsx

Return a JSON object: { "src/App.tsx": "...", "src/index.css": "...", "src/pages/ComponentName.tsx": "...", ... }
Return ONLY the JSON, no explanation.

${screenSummaries}`,
  ])

  let json = result.response.text().trim()
  if (json.startsWith('```json')) json = json.slice(7)
  else if (json.startsWith('```')) json = json.slice(3)
  if (json.endsWith('```')) json = json.slice(0, -3)
  json = json.trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(json)
  } catch {
    const braceStart = json.indexOf('{')
    const braceEnd = json.lastIndexOf('}')
    if (braceStart !== -1 && braceEnd > braceStart) {
      parsed = JSON.parse(json.slice(braceStart, braceEnd + 1))
    } else {
      console.error('[VibeSynth] Failed to parse frontend JSON. Response preview:', json.slice(0, 500))
      throw new Error(`Failed to parse generated project JSON. Response starts with: ${json.slice(0, 200)}`)
    }
  }

  // Merge Gemini output into scaffolding files
  for (const [key, value] of Object.entries(parsed)) {
    files[key] = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }
  return files
}

/**
 * Edit a specific file in the frontend project based on a natural language prompt.
 * Returns the updated file content.
 */
export async function editFrontendFile(
  filePath: string,
  currentContent: string,
  editPrompt: string,
  projectContext?: { files: string[]; screens: string[] },
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const contextInfo = projectContext
    ? `\nProject files: ${projectContext.files.join(', ')}\nScreens/routes: ${projectContext.screens.join(', ')}`
    : ''

  const result = await model.generateContent([
    `You are editing a React component file in a Vite + React Router project.

File: ${filePath}${contextInfo}

Current file content:
${currentContent}

User's modification request: "${editPrompt}"

Rules:
1. Return ONLY the complete updated file content
2. Apply the requested changes while keeping the rest of the file intact
3. Maintain all imports, exports, and component structure
4. Keep all existing styling and visual design unless the user specifically asks to change it
5. If the user asks for behavior changes (navigation, interactions, animations), implement them properly in React
6. Return ONLY valid TSX/TS code. No markdown, no code fences, no explanation.`,
  ])

  let code = result.response.text().trim()
  if (code.startsWith('```tsx') || code.startsWith('```typescript')) {
    code = code.replace(/^```\w*\n?/, '')
  } else if (code.startsWith('```')) {
    code = code.slice(3)
  }
  if (code.endsWith('```')) code = code.slice(0, -3)

  return code.trim()
}

/**
 * Incremental build: generate React page components only for new/changed screens.
 * Also regenerates App.tsx to wire all routes (existing + new).
 *
 * @param newScreens - screens that need Gemini generation (new or changed)
 * @param allScreens - all screens (for route wiring in App.tsx)
 * @param existingFiles - already generated files from previous build (for context)
 * @param deviceType - device type
 */
export async function generateIncrementalFrontend(
  newScreens: { name: string; html: string }[],
  allScreens: { name: string; html: string }[],
  existingFiles: Record<string, string>,
  deviceType: 'app' | 'web' | 'tablet' = 'web',
): Promise<Record<string, string>> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    // responseMimeType removed — preview models may not support it; parse JSON from text
  })

  const allRoutes = allScreens.map((s, i) => ({
    name: s.name,
    component: s.name.replace(/[^a-zA-Z0-9]/g, ''),
    route: i === 0 ? '/' : `/${slugify(s.name)}`,
  }))

  const newScreenSummaries = newScreens.map((s) => {
    const route = allRoutes.find(r => r.name === s.name)!
    const stripped = stripHeavyContent(s.html)
    const truncated = stripped.length > 8000 ? stripped.slice(0, 8000) + '\n<!-- truncated -->' : stripped
    return `NEW Screen: "${s.name}" (route: ${route.route}, component: ${route.component})\n<html>\n${truncated}\n</html>`
  }).join('\n\n')

  const existingScreenNames = allScreens
    .filter(s => !newScreens.some(ns => ns.name === s.name))
    .map(s => {
      const route = allRoutes.find(r => r.name === s.name)!
      return `"${s.name}" (route: ${route.route}, component: ${route.component}) — ALREADY BUILT, DO NOT regenerate`
    }).join('\n')

  const existingAppTsx = existingFiles['src/App.tsx'] || ''
  const existingIndexCss = existingFiles['src/index.css'] || ''

  const result = await model.generateContent([
    `You are doing an INCREMENTAL BUILD for a React+Vite+ReactRouter project.

Some screens have already been built. You only need to generate files for NEW screens and update App.tsx to include all routes.

ALL routes (existing + new): ${JSON.stringify(allRoutes)}

ALREADY BUILT screens (do NOT regenerate these page files):
${existingScreenNames || '(none)'}

Existing App.tsx for reference:
${existingAppTsx.slice(0, 2000)}

Existing index.css for reference:
${existingIndexCss.slice(0, 1000)}

NEW screens to generate:
${newScreenSummaries}

RULES:
- Generate ONLY: src/pages/{Component}.tsx for each NEW screen, and an updated src/App.tsx with ALL routes
- Convert class→className, inline style strings→React style objects
- Wire navigation elements to React Router <Link> or useNavigate()
- Keep all colors, fonts, layout from original HTML
- Replace data:image URLs with placeholder divs using background colors
- The updated App.tsx must import ALL page components (existing + new) and define Routes for all of them
- Do NOT regenerate package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, or existing page files
- If new screens need additional CSS (font imports etc), include an src/index.css with the FULL updated content

Return a JSON object: { "filepath": "file content string", ... }
Only include files that need to be created or updated.`,
  ])

  let json = result.response.text().trim()
  if (json.startsWith('```json')) json = json.slice(7)
  else if (json.startsWith('```')) json = json.slice(3)
  if (json.endsWith('```')) json = json.slice(0, -3)
  json = json.trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(json)
  } catch {
    const braceStart = json.indexOf('{')
    const braceEnd = json.lastIndexOf('}')
    if (braceStart !== -1 && braceEnd > braceStart) {
      parsed = JSON.parse(json.slice(braceStart, braceEnd + 1))
    } else {
      throw new Error('Failed to parse incremental build JSON')
    }
  }

  const files: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    files[key] = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }
  return files
}

/**
 * Simple hash of a string for build cache comparison.
 */
/**
 * Fix build errors by sending error output + problematic files to Gemini.
 * Returns a map of fixed files.
 */
export async function fixBuildErrors(
  errorOutput: string,
  projectFiles: Record<string, string>,
): Promise<Record<string, string>> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    // responseMimeType removed — preview models may not support it; parse JSON from text
  })

  const fileList = Object.entries(projectFiles)
    .map(([path, content]) => `=== ${path} ===\n${content.slice(0, 3000)}`)
    .join('\n\n')

  const result = await model.generateContent([
    `A React + Vite + TypeScript project has build/compile errors. Fix them.

ERROR OUTPUT:
${errorOutput.slice(0, 3000)}

PROJECT FILES:
${fileList.slice(0, 20000)}

RULES:
- Analyze the error and identify which file(s) need fixing
- Return ONLY the files that need changes, with their COMPLETE corrected content
- Fix TypeScript errors, missing imports, JSX issues, syntax errors
- Do NOT change the visual design or layout, only fix compilation errors
- Return a JSON object: { "filepath": "fixed file content", ... }
- Only include files that actually need changes`,
  ])

  let json = result.response.text().trim()
  if (json.startsWith('```json')) json = json.slice(7)
  else if (json.startsWith('```')) json = json.slice(3)
  if (json.endsWith('```')) json = json.slice(0, -3)
  json = json.trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(json)
  } catch {
    const braceStart = json.indexOf('{')
    const braceEnd = json.lastIndexOf('}')
    if (braceStart !== -1 && braceEnd > braceStart) {
      parsed = JSON.parse(json.slice(braceStart, braceEnd + 1))
    } else {
      throw new Error('Failed to parse fix response')
    }
  }

  const files: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    files[key] = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }
  return files
}

export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + ch
    hash |= 0
  }
  return hash.toString(36)
}

export { slugify }

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function deriveScreenName(prompt: string): string {
  const words = prompt.split(/\s+/).slice(0, 4)
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

/**
 * Analyze a design image (from Pinterest, Dribbble, etc.) using Gemini Vision
 * and extract a full DesignSystem with colors, typography, and guide.
 */
export async function analyzeDesignFromImage(base64: string, mimeType: string): Promise<{
  colors: {
    primary: { base: string; tones: string[] }
    secondary: { base: string; tones: string[] }
    tertiary: { base: string; tones: string[] }
    neutral: { base: string; tones: string[] }
  }
  typography: {
    headline: { family: string; size?: string; weight?: string; lineHeight?: string }
    body: { family: string; size?: string; weight?: string; lineHeight?: string }
    label: { family: string; size?: string; weight?: string; lineHeight?: string }
  }
  components?: {
    buttonRadius: string; buttonPadding: string; buttonFontWeight: string
    inputRadius: string; inputBorder: string; inputPadding: string; inputBg: string
    cardRadius: string; cardShadow: string; cardPadding: string
    chipRadius: string; chipPadding: string; chipBg: string
    fabSize: string; fabRadius: string
  }
  name: string
  guide: DesignGuide
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
    `Analyze this UI/UX design image and extract a complete design system including component styles. Look carefully at colors, typography, spacing, button shapes, input fields, card styles, and overall visual language.

Return ONLY valid JSON with this exact structure:
{
  "name": "Theme Name (creative, 2-3 words)",
  "colors": {
    "primary": { "base": "#HEX", "tones": ["#T0_darkest", "#T10", "#T20", "#T30", "#T40", "#T50", "#T60_base", "#T70", "#T80", "#T90", "#T95", "#T100_lightest"] },
    "secondary": { "base": "#HEX", "tones": [...12 tones...] },
    "tertiary": { "base": "#HEX", "tones": [...12 tones...] },
    "neutral": { "base": "#HEX", "tones": [...12 tones...] }
  },
  "typography": {
    "headline": { "family": "Font Name", "size": "32px", "weight": "700", "lineHeight": "1.2" },
    "body": { "family": "Font Name", "size": "16px", "weight": "400", "lineHeight": "1.5" },
    "label": { "family": "Font Name", "size": "12px", "weight": "500", "lineHeight": "1.4" }
  },
  "components": {
    "buttonRadius": "8px",
    "buttonPadding": "10px 20px",
    "buttonFontWeight": "600",
    "inputRadius": "8px",
    "inputBorder": "1px solid #ccc",
    "inputPadding": "10px 14px",
    "inputBg": "#ffffff",
    "cardRadius": "12px",
    "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
    "cardPadding": "20px",
    "chipRadius": "9999px",
    "chipPadding": "4px 12px",
    "chipBg": "#f0f0f0",
    "fabSize": "56px",
    "fabRadius": "16px"
  },
  "guide": {
    "overview": "A 2-3 sentence creative north star.",
    "colorRules": "Color usage rules with exact hex codes.",
    "typographyRules": "Typography scale with sizes, weights, line-heights. Include Google Fonts @import.",
    "elevationRules": "Shadows, layering, borders, blur effects.",
    "componentRules": "Button styles, card styles, input patterns, navigation patterns.",
    "dosAndDonts": "3 DO rules and 3 DON'T rules."
  }
}

Extract EXACT colors and CSS values observed in the design. For typography, identify the closest Google Font.
The tones array must have exactly 12 entries from darkest (T0) to lightest (T100).
The components object must contain realistic CSS values matching the design's visual style.
Return ONLY the JSON, no other text.`,
  ])

  let json = result.response.text().trim()
  if (json.startsWith('```json')) json = json.slice(7)
  else if (json.startsWith('```')) json = json.slice(3)
  if (json.endsWith('```')) json = json.slice(0, -3)

  return JSON.parse(json.trim())
}

const LIVE_EDIT_PREVIEW_CHARS = 6000

/** Plain-language explanation for designers after a successful live edit. */
export async function paraphraseLiveEditForDesigner(
  userPrompt: string,
  filePath: string,
  beforePreview: string,
  afterPreview: string,
  locale: 'en' | 'ko',
): Promise<string> {
  if (!API_KEY) {
    return locale === 'ko'
      ? '요청하신 내용을 라이브 앱에 반영했습니다. 화면을 확인해 보세요.'
      : 'Your request was applied to the live app. Check the preview.'
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
  const lang =
    locale === 'ko'
      ? '한국어로, 비개발자·디자이너가 이해하기 쉽게 2~4문장으로 작성하세요.'
      : 'Write in clear, plain English for designers and non-engineers (2–4 short sentences).'

  const result = await model.generateContent([
    `You explain UI/code changes to designers after an AI edit. ${lang}

The user asked (live preview): "${userPrompt}"
The modified file (for context only, do not quote paths prominently): ${filePath}

Before (excerpt):
${beforePreview.slice(0, LIVE_EDIT_PREVIEW_CHARS)}

After (excerpt):
${afterPreview.slice(0, LIVE_EDIT_PREVIEW_CHARS)}

Rules:
- Do NOT paste code blocks or long technical dumps.
- Focus on what users will SEE or EXPERIENCE in the running app.
- Do NOT repeat only the raw user prompt; interpret what was done.
- Output ONLY the friendly explanation, no headings.`,
  ])

  const text = result.response.text().trim()
  return (
    text ||
    (locale === 'ko' ? '화면에 반영할 변경을 적용했습니다.' : 'Changes were applied to the live app.')
  )
}

/** Friendly message when live edit fails (Designer mode). */
export async function paraphraseLiveEditFailure(
  userPrompt: string,
  errorMessage: string,
  locale: 'en' | 'ko',
): Promise<string> {
  if (!API_KEY) return errorMessage

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
  const lang =
    locale === 'ko'
      ? '한국어로, 짧고 친절하게 2문장 이내.'
      : 'In friendly plain English, at most 2 short sentences.'

  const result = await model.generateContent([
    `A live preview edit failed. ${lang}
User wanted: "${userPrompt}"
Technical error: ${errorMessage}

Explain briefly in human terms (no stack traces, no "Error:" prefix). Output ONLY the explanation.`,
  ])

  const text = result.response.text().trim()
  return text || errorMessage
}
