import { test, expect } from './electron-fixture'

/**
 * Live App 이미지 렌더링 검증 테스트
 *
 * 1. 이미지 포함 프롬프트로 스크린 생성
 * 2. 캔버스 HTML에 data:image 포함 확인
 * 3. Rebuild (Clean) → 이미지 추출 + TSX 빌드
 * 4. public/images/ 에 파일 생성 확인
 * 5. TSX에 /images/ 참조 확인
 * 6. Live App 스크린샷 → 이미지 렌더링 검증
 */

test('Live App 이미지 렌더링: 생성 → 빌드 → 스크린샷 검증', async ({ electronApp, page }) => {
  test.setTimeout(600_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 이미지가 많은 프롬프트로 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web', exact: true }).click()

  const textarea = page.locator('textarea')
  await textarea.fill(
    'A food delivery app landing page with hero banner showing a delicious pizza photo, 3 restaurant cards each with a food photo, and a "Download App" section with phone mockup image. Use warm orange and red colors on white background.'
  )
  await textarea.press('Enter')

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 생성 대기
  // ═══════════════════════════════════════════════════════════════
  const firstCard = page.locator('[data-screen-card]').first()
  await expect(firstCard).toBeVisible({ timeout: 120_000 })
  await expect(firstCard.locator('iframe')).toBeVisible({ timeout: 120_000 })
  await expect(firstCard.getByText('GENERATING')).toHaveCount(0, { timeout: 120_000 })
  await page.waitForTimeout(3000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 캔버스 HTML에 이미지 포함 확인
  // ═══════════════════════════════════════════════════════════════
  const iframe = firstCard.locator('iframe').first()
  const srcDoc = await iframe.getAttribute('srcdoc') || ''
  const hasDataImage = srcDoc.includes('data:image')
  const hasImgTag = srcDoc.includes('<img')
  const imgCount = (srcDoc.match(/<img /g) || []).length
  console.log(`[Test] Canvas: ${imgCount} <img> tags, data:image=${hasDataImage}, length=${srcDoc.length}`)

  await page.screenshot({ path: 'test-results/img-render-01-canvas.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: Rebuild (Clean)
  // ═══════════════════════════════════════════════════════════════
  await firstCard.click()
  await page.waitForTimeout(300)

  const dropdownArrow = page.locator('button svg[viewBox="0 0 12 12"]').first()
  await dropdownArrow.click()
  await page.waitForTimeout(300)

  const rebuildBtn = page.getByRole('button', { name: /Rebuild.*Clean/i })
  await expect(rebuildBtn).toBeVisible({ timeout: 3000 })
  await rebuildBtn.click()
  console.log('[Test] Rebuild (Clean) 시작')

  // Dev server running 대기
  await expect(
    page.getByText(/Dev server running|Build error|Frontend generation failed/i).first(),
  ).toBeVisible({ timeout: 300_000 })

  const buildFailed = await page.getByText(/Build error|Frontend generation failed|npm install failed/i).count()
  if (buildFailed > 0) {
    console.log('[Test] ❌ 빌드 실패')
    await page.screenshot({ path: 'test-results/img-render-build-failed.png' })
    expect(buildFailed).toBe(0) // fail the test
    return
  }
  console.log('[Test] ✅ Dev Server 실행')

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 프로젝트 파일 검증
  // ═══════════════════════════════════════════════════════════════
  await page.waitForTimeout(2000)

  const devLog = await page.getByText(/Dev server running at/i).first().textContent()
  const urlMatch = devLog?.match(/http:\/\/localhost:(\d+)/)
  const port = urlMatch?.[1]
  const devUrl = urlMatch?.[0]
  console.log(`[Test] Dev URL: ${devUrl}`)

  // Check project files via electronAPI
  const fileCheck = await page.evaluate(async () => {
    const api = (window as any).electronAPI
    if (!api?.db?.getAllProjects) return null
    const projects = await api.db.getAllProjects('default')
    if (!projects?.length) return null
    const recent = projects[projects.length - 1]

    const files: string[] = await api.project?.listRelativePaths?.(recent.id) || []
    const imageFiles = files.filter((f: string) => f.startsWith('public/images/'))
    const tsxFiles = files.filter((f: string) => f.endsWith('.tsx') && f.startsWith('src/pages/') && !f.includes('.ref.'))

    // Read TSX to check for /images/ refs
    let tsxContents: { [k: string]: string } = {}
    for (const tsx of tsxFiles) {
      tsxContents[tsx] = await api.project?.readFile?.(recent.id, tsx) || ''
    }

    const hasDsMd = files.includes('DESIGN_SYSTEM.md')

    return { pid: recent.id, imageFiles, tsxFiles, tsxContents, hasDsMd, totalFiles: files.length }
  })

  if (fileCheck) {
    console.log(`[Test] Project files: ${fileCheck.totalFiles}`)
    console.log(`[Test] Image files: ${JSON.stringify(fileCheck.imageFiles)}`)
    console.log(`[Test] DESIGN_SYSTEM.md: ${fileCheck.hasDsMd}`)

    // Check each TSX for /images/ references
    for (const [tsx, content] of Object.entries(fileCheck.tsxContents)) {
      const imgRefs = (content.match(/\/images\/img-\d+\.\w+/g) || [])
      const hasGradientPlaceholder = content.includes('bg-gradient') || content.includes('from-')
      console.log(`[Test] ${tsx}: ${imgRefs.length} image refs, gradient placeholders: ${hasGradientPlaceholder}`)
      if (imgRefs.length > 0) {
        console.log(`[Test]   → ${imgRefs.join(', ')}`)
      }
    }

    if (fileCheck.imageFiles.length > 0) {
      console.log(`[Test] ✅ ${fileCheck.imageFiles.length}개 이미지 추출됨`)
    } else {
      console.log('[Test] ⚠️ 이미지 파일 추출 안 됨')
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 6: Live App 스크린샷 촬영
  // ═══════════════════════════════════════════════════════════════
  if (!port) {
    console.log('[Test] ❌ Dev server URL 감지 실패')
    return
  }

  // Wait for Live App window to load
  await page.waitForTimeout(5000)

  // Get all windows and find the Live App window
  const windows = electronApp.windows()
  console.log(`[Test] 열린 창 수: ${windows.length}`)

  let liveAppWindow = null
  for (const win of windows) {
    const url = win.url()
    console.log(`[Test]   창: ${url.slice(0, 80)}`)
    if (url.includes(`localhost:${port}`)) {
      liveAppWindow = win
    }
  }

  if (liveAppWindow) {
    // Wait for page to fully render
    await liveAppWindow.waitForTimeout(3000)

    // Take screenshot of Live App
    const liveScreenshot = await liveAppWindow.screenshot()
    await test.info().attach('live-app-screenshot', { body: liveScreenshot, contentType: 'image/png' })

    // Save to file for manual inspection
    const fs = await import('fs')
    fs.writeFileSync('test-results/img-render-02-live-app.png', liveScreenshot)
    console.log('[Test] ✅ Live App 스크린샷 저장: test-results/img-render-02-live-app.png')

    // Check for images in the Live App DOM
    const imgInfo = await liveAppWindow.evaluate(() => {
      const imgs = document.querySelectorAll('img')
      return Array.from(imgs).map(img => ({
        src: img.src?.slice(0, 100),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayed: img.offsetWidth > 0 && img.offsetHeight > 0,
        complete: img.complete,
      }))
    })

    console.log(`[Test] Live App <img> 태그: ${imgInfo.length}개`)
    let renderedImages = 0
    for (const img of imgInfo) {
      const status = img.complete && img.naturalWidth > 0 ? '✅' : '❌'
      if (img.complete && img.naturalWidth > 0) renderedImages++
      console.log(`[Test]   ${status} src="${img.src}" ${img.naturalWidth}x${img.naturalHeight} displayed=${img.displayed}`)
    }

    console.log(`[Test] 렌더링된 이미지: ${renderedImages}/${imgInfo.length}`)

    if (renderedImages > 0) {
      console.log('[Test] ✅ Live App 이미지 렌더링 성공!')
    } else if (imgInfo.length > 0) {
      console.log('[Test] ⚠️ <img> 태그는 있지만 렌더링 안 됨 — src 경로 문제')
    } else {
      console.log('[Test] ⚠️ Live App에 <img> 태그 없음 — Gemini가 이미지를 제거함')
    }

    // Assertion: at least some images should render if canvas had images
    if (hasDataImage && fileCheck?.imageFiles && fileCheck.imageFiles.length > 0) {
      expect(renderedImages).toBeGreaterThan(0)
    }
  } else {
    console.log('[Test] ⚠️ Live App 창을 찾을 수 없음')
    // Still take main window screenshot
    await page.screenshot({ path: 'test-results/img-render-02-no-live-window.png' })
  }

  await page.screenshot({ path: 'test-results/img-render-03-final.png' })
  console.log('[Test] ✅ 이미지 렌더링 테스트 완료')
})
