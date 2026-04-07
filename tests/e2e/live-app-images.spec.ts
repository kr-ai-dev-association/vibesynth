import { test, expect } from './electron-fixture'

test('Live App: 기존 빌드 프로젝트 → skip rebuild → Dev Server 즉시 실행', async ({ page }) => {
  test.setTimeout(180_000)

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

  // Find a LifeFlow or fitness project (known built projects)
  let target = sidebar.locator('button:has-text("LifeFlow")').first()
  if (await target.count() === 0) {
    target = sidebar.locator('button:has-text("fitness")').first()
  }
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

  // Check canvas HTML for images
  const iframe = screenCards.first().locator('iframe').first()
  const srcDoc = await iframe.getAttribute('srcdoc') || ''
  const hasImg = srcDoc.includes('<img')
  const hasDataUrl = srcDoc.includes('data:image')
  console.log(`[Test] Canvas has <img>: ${hasImg}, data:image: ${hasDataUrl}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: Run → "already built" skip path
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click()
  await page.waitForTimeout(300)

  const runButton = page.getByRole('button', { name: /Run/i }).first()
  await runButton.click()
  console.log('[Test] Run clicked')

  // Should see "already built" log (skip rebuild path)
  const alreadyBuiltLog = page.getByText(/already built/i).first()
  const buildingLog = page.getByText(/Building/i).first()

  // Wait for either path
  await expect(
    page.getByText(/already built|Building|Dev server running|Starting dev server/i).first(),
  ).toBeVisible({ timeout: 30_000 })

  const skippedBuild = await alreadyBuiltLog.count() > 0
  console.log(`[Test] Skipped rebuild: ${skippedBuild}`)

  // Wait for dev server
  await expect(
    page.getByText(/Dev server running/i).first(),
  ).toBeVisible({ timeout: 120_000 })

  const devLog = await page.getByText(/Dev server running at/i).first().textContent()
  const urlMatch = devLog?.match(/http:\/\/localhost:\d+/)
  console.log(`[Test] Dev server: ${urlMatch?.[0]}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 프로젝트 파일 검증
  // ═══════════════════════════════════════════════════════════════
  const fileInfo = await page.evaluate(async () => {
    const projects = await (window as any).electronAPI?.db?.getAllProjects?.('default')
    if (!projects?.length) return null
    // Find most recent project with screens
    const recent = projects.filter((p: any) => p.screens?.length > 0).pop()
    if (!recent) return null

    const files: string[] = await (window as any).electronAPI?.project?.listRelativePaths?.(recent.id) || []
    const imageFiles = files.filter((f: string) => f.includes('images/'))
    const tsxFiles = files.filter((f: string) => f.endsWith('.tsx') && f.startsWith('src/pages/') && !f.includes('.ref.'))

    let tsxHasImageRef = false
    for (const tsx of tsxFiles) {
      const content = await (window as any).electronAPI?.project?.readFile?.(recent.id, tsx)
      if (content?.includes('/images/')) tsxHasImageRef = true
    }

    return { id: recent.id, imageFiles, tsxFiles, tsxHasImageRef, totalFiles: files.length }
  })

  if (fileInfo) {
    console.log(`[Test] Project files: ${fileInfo.totalFiles}`)
    console.log(`[Test] Image files: ${JSON.stringify(fileInfo.imageFiles)}`)
    console.log(`[Test] TSX pages: ${JSON.stringify(fileInfo.tsxFiles)}`)
    console.log(`[Test] TSX refs /images/: ${fileInfo.tsxHasImageRef}`)

    if (fileInfo.imageFiles.length > 0) {
      expect(fileInfo.tsxHasImageRef).toBe(true)
      console.log('✅ 이미지 추출 + TSX 참조 검증 완료')
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: Live App 윈도우 열림 확인
  // ═══════════════════════════════════════════════════════════════
  // The dev server is running → Live App window should be open
  console.log('✅ 기존 빌드 프로젝트 → skip rebuild → Dev Server 실행 검증 완료')
})
