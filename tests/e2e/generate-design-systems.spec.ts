import { test, expect } from './electron-fixture'

const STYLE_PROMPTS = [
  {
    device: 'Web',
    prompt: 'A luxury fashion e-commerce homepage. Use deep black (#0A0A0A) background with gold (#C9A84C) accents, elegant serif typography (Playfair Display), large editorial product photos, minimal layout with generous whitespace.',
  },
  {
    device: 'Web',
    prompt: 'A bright kids educational quiz app landing page. Use candy colors — primary blue (#3B82F6), secondary coral (#F97316), accents of purple (#8B5CF6) and green (#22C55E). Rounded bubbly shapes, Nunito font, large playful illustrations.',
  },
  {
    device: 'Web',
    prompt: 'A minimalist Japanese zen garden meditation app. Use off-white (#FAF9F6) background, muted sage green (#6B7F6B) primary, warm stone (#A0937D) secondary. Noto Serif JP font, lots of negative space, soft shadows.',
  },
  {
    device: 'Web',
    prompt: 'A neon cyberpunk gaming dashboard. Deep purple-black (#0D0221) background, electric cyan (#00FFFF) and hot magenta (#FF00FF) accents, Orbitron font. Glowing borders, holographic gradients, futuristic card layouts.',
  },
  {
    device: 'Web',
    prompt: 'A cozy coffee shop menu and ordering page. Warm brown (#4A2C2A) and cream (#FFF8F0) palette, accent of burnt orange (#D2691E). Libre Baskerville serif for headings, hand-drawn style icons, rustic card borders.',
  },
  {
    device: 'Web',
    prompt: 'A clean healthcare patient portal dashboard. Light blue (#EFF6FF) background, primary blue (#2563EB), success green (#10B981), error red (#EF4444). Inter font, clinical clean layout, data cards with clear hierarchy.',
  },
  {
    device: 'Web',
    prompt: 'A vibrant music streaming app homepage. Dark gradient (#1A1A2E to #16213E) background, neon green (#1DB954) primary like Spotify, pink (#FF6B9D) secondary. Montserrat bold font, album art grids, horizontal scroll playlists.',
  },
  {
    device: 'Web',
    prompt: 'A pastel aesthetic recipe & cooking blog. Soft lavender (#E8E0F0) and blush pink (#FFE4E8) sections on white. Coral (#FF6B6B) CTAs, Quicksand font. Rounded photo cards, delicate borders, watercolor-style section dividers.',
  },
  {
    device: 'Web',
    prompt: 'A bold sports news and scores portal. Pure white background, primary red (#DC2626), secondary navy (#1E3A5F). Oswald condensed headings, live score tickers, team color badges, dense information layout with clear sections.',
  },
  {
    device: 'Web',
    prompt: 'An eco-friendly sustainable marketplace. Natural green (#16A34A) primary on warm cream (#FEFCE8) background, terracotta (#C2410C) accents. Fraunces serif headings, organic shapes, leaf-pattern borders, eco-badge icons.',
  },
]

test('10가지 스타일 디자인 시스템 생성 및 저장', async ({ electronApp, page }) => {
  test.setTimeout(1_200_000) // 20 minutes max

  // Clear existing saved design systems from localStorage
  await page.evaluate(() => {
    localStorage.removeItem('vibesynth-design-guides')
  })
  // Reload to apply cleared state
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  for (let i = 0; i < STYLE_PROMPTS.length; i++) {
    const { device, prompt } = STYLE_PROMPTS[i]
    console.log(`\n═══ [${i + 1}/10] Generating: ${prompt.slice(0, 60)}...`)

    // Dashboard should be visible
    await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible({ timeout: 10_000 })

    // Select device type
    await page.getByRole('button', { name: device }).click()

    // Enter prompt and generate
    const textarea = page.locator('textarea')
    await textarea.fill(prompt)
    await textarea.press('Enter')

    // Wait for placeholder screen
    const screenCards = page.locator('[data-screen-card]')
    await expect(async () => {
      expect(await screenCards.count()).toBeGreaterThanOrEqual(1)
    }).toPass({ timeout: 15_000 })

    // Wait for GENERATING badge to disappear (screen content loaded)
    await expect(async () => {
      const badges = await page.locator('text=GENERATING').count()
      expect(badges).toBe(0)
    }).toPass({ timeout: 180_000 })

    console.log(`  Screen generated`)

    // Wait for design system to be extracted (theme name appears)
    const themeName = page.locator('[data-testid="theme-name"]')
    await expect(themeName).toBeVisible({ timeout: 30_000 })
    const name = await themeName.textContent()
    console.log(`  Design system: "${name}"`)

    // Take screenshot
    await page.screenshot({ path: `test-results/ds-${String(i + 1).padStart(2, '0')}-${name?.replace(/[^a-zA-Z0-9]/g, '-')?.slice(0, 30)}.png` })

    // Click "Save Design System"
    const saveBtn = page.locator('[data-testid="save-design-system"]')
    await expect(saveBtn).toBeVisible({ timeout: 5_000 })
    await saveBtn.click()
    await page.waitForTimeout(500)

    // Verify save confirmation in agent log
    await expect(page.getByText(/Design system ".*" saved/i).first()).toBeVisible({ timeout: 5_000 })
    console.log(`  Saved! ✓`)

    // Navigate back to dashboard
    await page.locator('[data-testid="hamburger-menu"]').click()
    await page.waitForTimeout(300)
    await page.locator('text=Go to all projects').click()
    await page.waitForTimeout(1500)
  }

  // Verify all 10 design systems are saved
  const savedCount = await page.evaluate(() => {
    const raw = localStorage.getItem('vibesynth-design-guides')
    if (!raw) return 0
    const entries = JSON.parse(raw)
    return entries.filter((e: { designSystem?: unknown }) => e.designSystem != null).length
  })

  console.log(`\n═══ Total saved design systems: ${savedCount}`)
  expect(savedCount).toBe(10)
  await page.screenshot({ path: 'test-results/ds-final-dashboard.png' })
  console.log('✓ All 10 design systems generated and saved')
})
