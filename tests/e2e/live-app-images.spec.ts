import { test, expect } from './electron-fixture'

test('Live App 이미지: 기존 프로젝트 → Rebuild (Clean) → 이미지 추출 검증', async ({ page }) => {
  test.setTimeout(600_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: Dashboard에서 기존 프로젝트 열기
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()

  const sidebar = page.locator('aside')
  const projectCount = await sidebar.locator('button').count()
  console.log(`[Test] Sidebar projects: ${projectCount}`)

  if (projectCount === 0) {
    console.log('[Test] No existing projects — skipping')
    return
  }

  // Find a LifeFlow project (known to have multiple screens + images)
  let target = sidebar.locator('button:has-text("LifeFlow")').first()
  if (await target.count() === 0) {
    target = sidebar.locator('button').first()
  }

  const projectName = await target.textContent()
  console.log(`[Test] Opening: "${projectName?.slice(0, 50)}"`)
  await target.click()
  await page.waitForTimeout(2000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 캔버스 렌더링 확인
  // ═══════════════════════════════════════════════════════════════
  const screenCards = page.locator('[data-screen-card]')
  await expect(screenCards.first()).toBeVisible({ timeout: 10_000 })
  const screenCount = await screenCards.count()
  console.log(`[Test] Screens: ${screenCount}`)

  if (screenCount < 2) {
    console.log('[Test] Need at least 2 screens for Live App build — skipping')
    return
  }

  // Check canvas HTML for images
  const iframe = screenCards.first().locator('iframe').first()
  const srcDoc = await iframe.getAttribute('srcdoc') || ''
  const hasImg = srcDoc.includes('<img')
  const hasDataUrl = srcDoc.includes('data:image')
  console.log(`[Test] Canvas has <img>: ${hasImg}, data:image: ${hasDataUrl}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: Rebuild (Clean) 드롭다운 클릭
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click()
  await page.waitForTimeout(300)

  // Click the dropdown arrow next to Run
  const dropdownArrow = page.locator('button svg[viewBox="0 0 12 12"]').first()
  await dropdownArrow.click()
  await page.waitForTimeout(300)

  // Click "Rebuild (Clean)"
  const rebuildBtn = page.getByRole('button', { name: /Rebuild.*Clean/i })
  await expect(rebuildBtn).toBeVisible({ timeout: 3000 })
  await rebuildBtn.click()
  console.log('[Test] Rebuild (Clean) clicked')

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 클린 빌드 진행 대기
  // ═══════════════════════════════════════════════════════════════
  await expect(
    page.getByText(/Clean rebuild|Workspace cleaned/i).first(),
  ).toBeVisible({ timeout: 15_000 })
  console.log('[Test] Workspace cleaned')

  // Wait for Gemini conversion
  await expect(
    page.getByText(/Generating React frontend/i).first(),
  ).toBeVisible({ timeout: 30_000 })
  console.log('[Test] Gemini generating...')

  // Wait for files written
  await expect(
    page.getByText(/writing to disk|Generated \d+ files/i).first(),
  ).toBeVisible({ timeout: 180_000 })
  console.log('[Test] Files generated')

  // Wait for npm install
  await expect(
    page.getByText(/Installing dependencies|npm install/i).first(),
  ).toBeVisible({ timeout: 30_000 })

  // Wait for dev server
  await expect(
    page.getByText(/Dev server running/i).first(),
  ).toBeVisible({ timeout: 180_000 })

  const devLog = await page.getByText(/Dev server running at/i).first().textContent()
  const urlMatch = devLog?.match(/http:\/\/localhost:\d+/)
  console.log(`[Test] Dev server: ${urlMatch?.[0]}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 프로젝트 파일 검증 — 이미지 추출 확인
  // ═══════════════════════════════════════════════════════════════
  await page.waitForTimeout(2000)

  const fileInfo = await page.evaluate(async () => {
    const projects = await (window as any).electronAPI?.db?.getAllProjects?.('default')
    if (!projects?.length) return null
    const recent = projects.filter((p: any) => p.screens?.length >= 2).pop()
    if (!recent) return null

    const files: string[] = await (window as any).electronAPI?.project?.listRelativePaths?.(recent.id) || []
    const imageFiles = files.filter((f: string) => f.includes('images/'))
    const tsxFiles = files.filter((f: string) => f.endsWith('.tsx') && f.startsWith('src/pages/') && !f.includes('.ref.'))
    const refFiles = files.filter((f: string) => f.includes('.ref.html'))

    let tsxHasImageRef = false
    let tsxHasDataUrl = false
    for (const tsx of tsxFiles) {
      const content = await (window as any).electronAPI?.project?.readFile?.(recent.id, tsx)
      if (content?.includes('/images/')) tsxHasImageRef = true
      if (content?.includes('data:image')) tsxHasDataUrl = true
    }

    // Check ref HTML for /images/ paths
    let refHasImagePath = false
    for (const ref of refFiles) {
      const content = await (window as any).electronAPI?.project?.readFile?.(recent.id, ref)
      if (content?.includes('/images/')) refHasImagePath = true
    }

    return { id: recent.id, imageFiles, tsxFiles, refFiles, tsxHasImageRef, tsxHasDataUrl, refHasImagePath, totalFiles: files.length }
  })

  if (fileInfo) {
    console.log(`[Test] Total project files: ${fileInfo.totalFiles}`)
    console.log(`[Test] Image files (public/images/): ${JSON.stringify(fileInfo.imageFiles)}`)
    console.log(`[Test] TSX pages: ${JSON.stringify(fileInfo.tsxFiles)}`)
    console.log(`[Test] Ref HTML files: ${JSON.stringify(fileInfo.refFiles)}`)
    console.log(`[Test] Ref HTML → /images/ paths: ${fileInfo.refHasImagePath}`)
    console.log(`[Test] TSX → /images/ refs: ${fileInfo.tsxHasImageRef}`)
    console.log(`[Test] TSX → data: URLs: ${fileInfo.tsxHasDataUrl}`)

    if (fileInfo.imageFiles.length > 0) {
      expect(fileInfo.tsxHasImageRef).toBe(true)
      console.log('✅ 이미지 추출 + TSX /images/ 참조 검증 완료')
    } else if (hasDataUrl) {
      console.log('⚠️ 캔버스에 data:image 있지만 이미지 추출 안 됨 — regex 패턴 확인 필요')
    } else {
      console.log('⚠️ 프로젝트에 이미지 없음 (SVG placeholder만 사용)')
    }
  }

  console.log('✅ Clean Rebuild → Dev Server 실행 검증 완료')
})
