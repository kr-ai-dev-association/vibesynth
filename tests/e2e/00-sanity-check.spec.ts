import { test, expect } from './electron-fixture'

/**
 * Sanity Check — 모든 테스트보다 먼저 실행.
 * 앱이 렌더링되고 기본 UI가 표시되는지 확인.
 */
test('00 — 앱 렌더링 확인: 화면이 흰색이 아닌 실제 UI가 표시되어야 함', async ({ page }) => {
  // 1. 즉시 스크린샷
  await page.screenshot({ path: 'test-results/00-immediate.png' })

  // 2. 페이지 URL이 about:blank이 아닌지 확인
  const url = page.url()
  console.log(`Page URL: ${url}`)
  expect(url).not.toBe('about:blank')

  // 3. body에 콘텐츠가 있는지 확인 (흰 화면 감지)
  const bodyText = await page.locator('body').textContent({ timeout: 10_000 })
  console.log(`Body text (first 100 chars): ${bodyText?.slice(0, 100)}`)
  expect(bodyText?.length).toBeGreaterThan(10)

  // 4. root div에 React 앱이 마운트되었는지 확인
  const rootChildren = await page.locator('#root').evaluate(el => el.children.length)
  console.log(`#root children: ${rootChildren}`)
  expect(rootChildren).toBeGreaterThan(0)

  // 5. VibeSynth 텍스트 확인 (한국어/영어 무관)
  const hasApp = await page.getByText(/VibeSynth|vibesynth/i).first().isVisible({ timeout: 5_000 }).catch(() => false)
  console.log(`VibeSynth visible: ${hasApp}`)
  expect(hasApp).toBe(true)

  // 6. 최종 스크린샷
  await page.screenshot({ path: 'test-results/00-rendered.png' })
  console.log('✅ 앱 렌더링 정상')
})
