import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DesignGuide } from '../App'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string

if (!API_KEY) {
  console.error(
    '[VibeSynth] VITE_GEMINI_API_KEY not found. ' +
    'Ensure .env file exists in project root with VITE_GEMINI_API_KEY=your_key'
  )
}

const genAI = new GoogleGenerativeAI(API_KEY || '')

const SYSTEM_PROMPT = `You are VibeSynth, an AI design tool that generates mobile and web app UI designs as HTML+CSS.

When given a design prompt, generate a complete, visually polished UI screen as self-contained HTML with inline CSS.

Rules:
1. Output ONLY valid HTML. No markdown, no code fences, no explanation.
2. Use modern CSS (flexbox, grid, custom properties, gradients, shadows).
3. Include realistic sample data and placeholder images (use solid colored divs or SVG icons instead of <img> with external URLs).
4. Make it look like a real, production-quality app design - not a wireframe.
5. Use a cohesive color palette with a primary accent color.
6. Include proper typography hierarchy (headers, body, captions).
7. For mobile apps: use 390px width, include status bar, navigation bar, and realistic content.
8. For web apps: use full responsive width with proper layout.
9. Use Google Material Icons via inline SVGs where needed.
10. All styles must be inline or in a <style> tag within the HTML. No external CSS.

IMPORTANT: Return ONLY the HTML content, starting with <!DOCTYPE html> or <html> or <div>. No other text.`

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

export interface GenerateDesignResult {
  html: string
  screenName: string
}

export async function generateDesign(
  prompt: string,
  deviceType: 'app' | 'web' | 'tablet' = 'app',
  guide?: DesignGuide,
): Promise<GenerateDesignResult[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const deviceContext = deviceType === 'app'
    ? 'Design a native mobile app screen (390px width, mobile viewport).'
    : deviceType === 'tablet'
    ? 'Design a tablet app screen (1024px width, portrait tablet viewport like iPad Pro).'
    : 'Design a desktop web page (full width, responsive layout).'

  const guideContext = guide
    ? `\n\n${formatGuideForPrompt(guide)}\n\nYou MUST follow the design guide above when choosing colors, typography, elevation, components, and overall visual style.`
    : ''

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `${deviceContext}${guideContext}\n\nUser request: ${prompt}\n\nGenerate a single complete screen. Include realistic content and modern styling that adheres to the design guide.`,
  ])

  const text = result.response.text()

  // Extract HTML from response (handle code fences if present)
  let html = text.trim()
  if (html.startsWith('```html')) {
    html = html.slice(7)
  } else if (html.startsWith('```')) {
    html = html.slice(3)
  }
  if (html.endsWith('```')) {
    html = html.slice(0, -3)
  }
  html = html.trim()

  // Derive screen name from prompt
  const screenName = deriveScreenName(prompt)

  return [{ html, screenName }]
}

export async function editDesign(
  currentHtml: string,
  editPrompt: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `Here is the current design HTML:\n\n${currentHtml}\n\nUser wants to modify it: "${editPrompt}"\n\nReturn the COMPLETE modified HTML. Apply the requested changes while keeping the overall design intact.`,
  ])

  let html = result.response.text().trim()
  if (html.startsWith('```html')) html = html.slice(7)
  else if (html.startsWith('```')) html = html.slice(3)
  if (html.endsWith('```')) html = html.slice(0, -3)

  return html.trim()
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
    html,
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
