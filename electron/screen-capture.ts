/**
 * Render a screen's HTML to a PNG via a hidden BrowserWindow so Gemini's
 * multimodal API has the actual visual design (colors, spacing, typography
 * after CSS resolution) to look at — not just the source HTML.
 *
 * Why a real browser instead of a headless renderer (puppeteer, playwright)?
 * We're inside Electron — it ships Chromium. A `show: false` BrowserWindow
 * with `webPreferences: { offscreen: true }` is the cheapest path: no extra
 * dependency, full CSS support, native fonts.
 */

import * as fs from 'fs'

export interface CaptureOptions {
  width?: number   // CSS pixels (defaults to 412 — typical Compose phone)
  height?: number  // CSS pixels (defaults to 916)
  waitMs?: number  // delay after dom-ready before capture (lets fonts/img settle)
}

/**
 * Render `html` to PNG. Two strategies, picked based on runtime env:
 *  - Electron main process: hidden BrowserWindow + capturePage (no extra dep,
 *    matches Chromium version we ship).
 *  - Plain Node (test runner / scripts): Playwright (chromium). devDep we
 *    already have via @playwright/test.
 * Both paths produce equivalent PNGs for Gemini intake.
 */
export async function captureHtmlToPng(
  html: string,
  outPath: string,
  opts: CaptureOptions = {},
): Promise<{ pngPath: string; width: number; height: number }> {
  const width = opts.width ?? 412
  const height = opts.height ?? 916
  const waitMs = opts.waitMs ?? 600

  // Detect Electron — `electron` module exposes a `BrowserWindow` constructor
  // only when loaded by the Electron main process. In plain Node it returns
  // the binary path (string), so the import has no constructor on it.
  let BrowserWindowCtor: any = null
  try {
    const e = require('electron')
    if (e && typeof e.BrowserWindow === 'function') BrowserWindowCtor = e.BrowserWindow
  } catch { /* not installed / not in electron */ }

  if (BrowserWindowCtor) {
    return captureViaElectron(BrowserWindowCtor, html, outPath, width, height, waitMs)
  }
  return captureViaPlaywright(html, outPath, width, height, waitMs)
}

async function captureViaElectron(
  BrowserWindow: any,
  html: string,
  outPath: string,
  width: number,
  height: number,
  waitMs: number,
): Promise<{ pngPath: string; width: number; height: number }> {
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  try {
    const dataUrl = `data:text/html;base64,${Buffer.from(html, 'utf-8').toString('base64')}`
    await win.loadURL(dataUrl)
    await new Promise<void>((r) => setTimeout(r, waitMs))
    const img = await win.webContents.capturePage()
    fs.writeFileSync(outPath, img.toPNG())
    return { pngPath: outPath, width, height }
  } finally {
    try { win.destroy() } catch {}
  }
}

async function captureViaPlaywright(
  html: string,
  outPath: string,
  width: number,
  height: number,
  waitMs: number,
): Promise<{ pngPath: string; width: number; height: number }> {
  // Lazy import so Electron-runtime path doesn't pay the playwright cost.
  let chromium: any
  try {
    chromium = require('playwright').chromium
  } catch {
    try { chromium = require('@playwright/test').chromium } catch {}
  }
  if (!chromium) {
    throw new Error('Neither electron BrowserWindow nor playwright is available — cannot capture screenshot')
  }
  const browser = await chromium.launch({ headless: true })
  try {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.waitForTimeout(waitMs)
    await page.screenshot({ path: outPath, fullPage: false, type: 'png' })
    await ctx.close()
    return { pngPath: outPath, width, height }
  } finally {
    await browser.close().catch(() => {})
  }
}
