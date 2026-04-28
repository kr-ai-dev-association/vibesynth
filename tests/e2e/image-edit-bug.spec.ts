import { test, expect } from './electron-fixture'
import type { FrameLocator } from '@playwright/test'

test('이미지 변경 프롬프트 → 새 이미지 임베딩 검증 (LifeFlow Admin)', async ({ page }) => {
  // ─── 1. Probe DB: list existing projects so we can pick a generated one ───
  const projects = await page.evaluate(async () => {
    const api = (window as any).electronAPI
    if (!api?.db?.getAllProjects) return []
    const list = await api.db.getAllProjects('default')
    return (list || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      screenCount: (p.screens || []).length,
      deviceType: p.deviceType,
    }))
  })
  console.log('[TEST] Existing projects:', JSON.stringify(projects, null, 2))

  // Prefer ex-dashboard if already generated; otherwise any non-empty project
  const dashboardProject = projects.find((p: any) => p.id === 'ex-dashboard' && p.screenCount > 0)
    ?? projects.find((p: any) => p.screenCount > 0)
  expect(dashboardProject, 'No previously-generated project in DB. Create LifeFlow Admin Dashboard project first.').toBeTruthy()
  console.log('[TEST] Using project:', dashboardProject)

  // ─── 2. Reset stale generating flags (left over from previous interrupted runs) ───
  await page.evaluate(async (projectId: string) => {
    const api = (window as any).electronAPI
    const full = await api.db.getProject(projectId)
    if (!full) return
    const cleanedScreens = (full.screens || []).map((s: any) => ({ ...s, generating: false }))
    await api.db.saveProject({ ...full, screens: cleanedScreens })
  }, dashboardProject.id)

  // Inspect project state in DB
  const dbInspect = await page.evaluate(async (pid: string) => {
    const api = (window as any).electronAPI
    const full = await api.db.getProject(pid)
    return {
      id: full?.id,
      screens: (full?.screens || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        htmlLen: (s.html || '').length,
        imgs: ((s.html || '').match(/<img/gi) || []).length,
        generating: s.generating,
      })),
    }
  }, dashboardProject.id)
  console.log('[TEST] DB project inspect:', JSON.stringify(dbInspect, null, 2))

  // Trigger React open via direct sidebar click — simpler & exercises real path
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  // The sidebar lists recent projects; click the matching one
  const projectButton = page.locator(`text=${dashboardProject.name}`).first()
  await expect(projectButton).toBeVisible({ timeout: 10_000 })
  await projectButton.click()
  await page.waitForTimeout(2000)

  // After opening, count what screens are in editor state
  const editorState = await page.evaluate(() => {
    return {
      screenCards: document.querySelectorAll('[data-screen-card]').length,
      iframes: document.querySelectorAll('[data-screen-card] iframe').length,
      allIframes: document.querySelectorAll('iframe').length,
    }
  })
  console.log('[TEST] After project open:', editorState)

  // ─── 3. Wait for screens to render — poll until an iframe with <img> tags appears ───
  const screenCards = page.locator('[data-screen-card]')
  await expect(screenCards.first()).toBeVisible({ timeout: 30_000 })
  const iframes = page.locator('[data-screen-card] iframe')

  await expect.poll(async () => {
    const n = await iframes.count()
    let withImgs = 0
    let lens: number[] = []
    for (let i = 0; i < n; i++) {
      const html = await iframes.nth(i).getAttribute('srcdoc') ?? ''
      lens.push(html.length)
      if (/<img\b/i.test(html)) withImgs++
    }
    console.log(`[POLL] iframes=${n} withImgs=${withImgs} srcdocLens=${lens.join(',')}`)
    return withImgs
  }, { timeout: 90_000, intervals: [2000, 3000] }).toBeGreaterThan(0)

  const cardsCount = await screenCards.count()
  console.log(`[TEST] screenCards: ${cardsCount}, iframes: ${await iframes.count()}`)

  // Pick the screen CARD whose iframe has the most images
  let bestCardIdx = -1
  let bestImgCount = -1
  let bestSrcdocSnap = ''
  for (let i = 0; i < cardsCount; i++) {
    const cardIframe = screenCards.nth(i).locator('iframe')
    if (await cardIframe.count() === 0) continue
    const html = await cardIframe.getAttribute('srcdoc') ?? ''
    const imgs = (html.match(/<img\b/gi) || []).length
    console.log(`[TEST]   card[${i}] iframe imgs=${imgs}`)
    if (imgs > bestImgCount) {
      bestImgCount = imgs
      bestCardIdx = i
      bestSrcdocSnap = html
    }
  }
  expect(bestImgCount, 'No iframe with <img> tags').toBeGreaterThan(0)
  console.log(`[TEST] Selected card #${bestCardIdx} with ${bestImgCount} <img> tags`)

  const beforeImageSrcs: string[] = (bestSrcdocSnap.match(/src="data:image[^"]*"/gi) || [])
  console.log('[TEST] Base64 images before edit:', beforeImageSrcs.length)

  // Click the card's header strip (top-left, above iframe content)
  const targetCard = screenCards.nth(bestCardIdx)
  const cardBox = await targetCard.boundingBox()
  expect(cardBox).toBeTruthy()
  await page.mouse.click(cardBox!.x + 10, cardBox!.y + 10)
  await expect(page.getByText(/Modify|수정/)).toBeVisible({ timeout: 5_000 })

  // ─── 5. Enter Edit mode ───
  await page.getByText(/Modify|수정/).first().click()
  await page.getByRole('button', { name: /^Edit|편집$/ }).click()
  await expect(page.getByText(/Edit Mode|편집 모드/).first()).toBeVisible({ timeout: 3_000 })
  await page.waitForTimeout(4000)

  // ─── 6. The iframe inside the SELECTED card should now have both overlay + imgs ───
  const activeIframe = screenCards.nth(bestCardIdx).locator('iframe')
  const activeFrame = activeIframe.contentFrame()
  await expect(activeFrame.locator('#__vs_overlay')).toBeAttached({ timeout: 15_000 })
  const imgsInFrame = await activeFrame.locator('img').count()
  console.log(`[TEST] Edit-mode active iframe imgs=${imgsInFrame}`)
  expect(imgsInFrame, 'Edit-mode iframe lost its images').toBeGreaterThan(0)

  bestSrcdocSnap = await activeIframe.getAttribute('srcdoc') ?? ''
  const beforeImageSrcsActive: string[] = (bestSrcdocSnap.match(/src="data:image[^"]*"/gi) || [])
  console.log('[TEST] Active iframe — Base64 images before edit:', beforeImageSrcsActive.length)
  expect(beforeImageSrcsActive.length, 'Active iframe has no images').toBeGreaterThan(0)

  // Programmatically dispatch click on the first <img> inside the iframe.
  // (Real mouse clicks on transformed iframes are unreliable; the iframe's
  //  click handler attaches to document, so el.click() bubbles and fires it.)
  const tagClicked = await activeFrame.locator('img').first().evaluate((el: HTMLElement) => {
    el.click()
    return el.tagName.toLowerCase()
  })
  console.log(`[TEST] Programmatically clicked element: <${tagClicked}>`)

  await expect(page.getByText(/Selected </)).toBeVisible({ timeout: 10_000 })

  // ─── 7. Submit a NATURAL-LANGUAGE prompt (no explicit "image" keyword) ───
  const editorTextarea = page.locator('.max-w-2xl textarea')
  await editorTextarea.fill('이거 바꿔줘 — 활기찬 그라디언트 추상 배경으로')
  await editorTextarea.press('Enter')

  // Edit kicks off — could go through generatingImages or editingElement log
  await expect(page.getByText(/Editing element|요소 편집|이미지 생성|Generating images|Nano Banana/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/Updated element|요소 업데이트/i)).toBeVisible({ timeout: 240_000 })

  // ─── 8. Verify whether a NEW image was embedded ───
  const afterSrcdoc = await activeIframe.getAttribute('srcdoc') ?? ''
  const afterImageSrcs: string[] = (afterSrcdoc.match(/src="data:image[^"]*"/gi) || [])
  console.log('[TEST] Base64 images after edit:', afterImageSrcs.length)
  console.log('[TEST] All <img src> attrs after:', (afterSrcdoc.match(/<img[^>]*src="[^"]{0,80}/gi) || []).slice(0, 5))

  // Bug detection: the edited HTML should have at least as many base64 images as before,
  // and at least one src should be DIFFERENT (newly generated).
  const beforeSet = new Set(beforeImageSrcsActive)
  const afterSet = new Set(afterImageSrcs)
  const newImages = [...afterSet].filter((s) => !beforeSet.has(s))
  const dropped = [...beforeSet].filter((s) => !afterSet.has(s))
  console.log('[TEST] New base64 images:', newImages.length, 'Dropped:', dropped.length)

  // For a "replace this image" prompt:
  // - PASS: at least one new base64 data URL exists (new image generated & embedded)
  // - FAIL (bug): newImages === 0 → either old image preserved or replaced with placeholder/external URL
  expect.soft(newImages.length, 'BUG: no new base64 image embedded after image-change prompt').toBeGreaterThan(0)

  // Show what the AI produced for the targeted element
  const externalUrls = (afterSrcdoc.match(/<img[^>]*src="(https?:[^"]+|\/[^"]*)"/gi) || []).slice(0, 5)
  console.log('[TEST] External/relative <img src> after edit:', externalUrls)
})
