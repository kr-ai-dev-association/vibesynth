/**
 * E2E Test Script Generator
 *
 * Generates Playwright E2E test scripts from:
 * - PRD document (product requirements)
 * - Heatmap data (UX attention zones)
 * - Design system tokens
 * - Generated screen metadata
 *
 * The generated test verifies that the Live app matches PRD expectations
 * and heatmap-highlighted elements are interactive and visible.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { HeatmapZone } from '../App'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string

export interface E2ETestContext {
  prd: string
  screenNames: string[]
  heatmapData?: Map<string, HeatmapZone[]>
  designSystemName?: string
  deviceType: 'app' | 'web' | 'tablet'
  liveAppUrl?: string
}

/**
 * Generate a Playwright E2E test script for the Live app.
 * Tests are based on PRD requirements and heatmap attention zones.
 */
export async function generateE2ETestScript(ctx: E2ETestContext): Promise<string> {
  if (!API_KEY) {
    return generateFallbackTest(ctx)
  }

  const genAI = new GoogleGenerativeAI(API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  // Build heatmap context
  let heatmapContext = ''
  if (ctx.heatmapData && ctx.heatmapData.size > 0) {
    const zones: string[] = []
    for (const [screenName, hzones] of ctx.heatmapData) {
      for (const z of hzones) {
        zones.push(`  Screen "${screenName}": <${z.tagName}> "${z.label}" (attention: ${(z.intensity * 100).toFixed(0)}%) — ${z.reason}`)
      }
    }
    heatmapContext = `\n\nHeatmap attention zones (high-priority elements to test):\n${zones.join('\n')}`
  }

  const result = await model.generateContent([
    `Generate a Playwright E2E test script (TypeScript) for a React web app.

PRD:
${ctx.prd.slice(0, 4000)}

Screens: ${ctx.screenNames.join(', ')}
Device: ${ctx.deviceType}
Design System: ${ctx.designSystemName || 'auto'}
Base URL: ${ctx.liveAppUrl || 'http://localhost:5173'}${heatmapContext}

Generate a Playwright test file that:
1. Navigates to each screen/route
2. Verifies key PRD elements are visible (headings, buttons, cards, navigation)
3. Tests heatmap high-attention elements are clickable/interactive
4. Checks responsive layout basics
5. Takes screenshots at each step

Format:
- Use import { test, expect } from '@playwright/test'
- Use test.describe and test blocks
- Each screen gets its own test
- Use page.goto() for navigation
- Use expect().toBeVisible() for element checks
- Add meaningful test names based on PRD sections

Return ONLY the TypeScript code. No markdown fences, no explanation.`,
  ])

  let code = result.response.text().trim()
  if (code.startsWith('```typescript') || code.startsWith('```ts')) {
    code = code.replace(/^```\w*\n?/, '')
  } else if (code.startsWith('```')) {
    code = code.slice(3)
  }
  if (code.endsWith('```')) code = code.slice(0, -3)

  return code.trim()
}

/**
 * Fallback: generate a basic test without AI.
 */
function generateFallbackTest(ctx: E2ETestContext): string {
  const baseUrl = ctx.liveAppUrl || 'http://localhost:5173'
  const tests = ctx.screenNames.map((name, i) => {
    const route = i === 0 ? '/' : `/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    return `
  test('${name} screen renders correctly', async ({ page }) => {
    await page.goto('${baseUrl}${route}')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await page.screenshot({ path: 'test-results/e2e-${name.replace(/\s+/g, '-').toLowerCase()}.png' })
  })`
  }).join('\n')

  return `import { test, expect } from '@playwright/test'

test.describe('${ctx.designSystemName || 'App'} — PRD Verification', () => {${tests}
})
`
}
