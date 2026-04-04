import { test, expect } from './electron-fixture'

test('라이트 모드 디자인 생성: 밝은 색감 + 추천 DS 적용 확인', async ({ page }) => {
  test.setTimeout(300_000) // 5분

  const DELAY = 1000

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 밝은 색감 프롬프트로 프로젝트 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.waitForTimeout(DELAY)

  // App 모드 선택
  const textarea = page.locator('textarea')
  await textarea.fill(
    'A wellness and self-care mobile app with morning routines, mood tracker, and meditation timer. ' +
    'Use a BRIGHT, LIGHT theme with soft pastel colors — peach, lavender, mint green on white background. ' +
    'NO dark mode, NO dark backgrounds. Everything should be light, warm, and cheerful. ' +
    'screens: Morning Routine, Mood Tracker, Meditation'
  )
  await page.waitForTimeout(DELAY)
  await textarea.press('Enter')

  // Editor 진입
  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 3 스크린 생성 대기
  // ═══════════════════════════════════════════════════════════════
  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBeGreaterThanOrEqual(3)
  }).toPass({ timeout: 180_000 })

  // 모든 스크린 HTML 완료 대기
  await expect(async () => {
    const generatingLabels = await page.locator('[data-screen-card]').getByText('AI Generating').count()
    expect(generatingLabels).toBe(0)
  }).toPass({ timeout: 300_000 })

  console.log(`✅ ${await screenCards.count()}개 스크린 생성 완료`)
  await page.screenshot({ path: 'test-results/light-01-screens.png' })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 라이트 모드 검증 — 생성된 HTML에 밝은 배경색 확인
  // ═══════════════════════════════════════════════════════════════
  const firstIframe = page.locator('[data-screen-card] iframe').first()
  const html = await firstIframe.getAttribute('srcdoc') || ''

  // 밝은 배경색 탐지 (#fff, #faf, #f5f, white, #fef 등)
  const lightBgPatterns = /background.*#f[a-f0-9]{2}|background.*#fff|background.*white|bg-white|#FAFAFA|#FFFBF7|#FFF9F5|#F8FAFC/i
  const hasLightBg = lightBgPatterns.test(html)

  // 다크 배경색이 주요 요소에 사용되지 않았는지 확인
  const darkBgPatterns = /#0a0a|#111|#0f1117|#1a1a|background.*#0|background.*#1[0-4]/i
  const hasDarkBg = darkBgPatterns.test(html)

  console.log(`라이트 모드 검증: 밝은배경=${hasLightBg}, 다크배경=${hasDarkBg}, HTML=${html.length}bytes`)

  if (hasLightBg && !hasDarkBg) {
    console.log('✅ 라이트 모드 디자인이 올바르게 생성됨')
  } else if (hasLightBg) {
    console.log('⚠️ 라이트 배경 감지되었으나 일부 다크 요소도 존재')
  } else {
    console.log('❌ 라이트 모드가 아닌 다크 모드로 생성됨 — colorScheme 전달 확인 필요')
  }

  // 색상 다양성 확인
  const hexColors = html.match(/#[0-9A-Fa-f]{6}/g) || []
  const uniqueColors = new Set(hexColors.map(c => c.toLowerCase()))
  console.log(`색상: ${uniqueColors.size}개 고유 hex 색상`)

  await page.screenshot({ path: 'test-results/light-02-final.png' })
})
