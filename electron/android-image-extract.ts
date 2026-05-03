/**
 * Pull every <img src="data:image/...;base64,..."> out of a screen's HTML,
 * decode them to bytes, and write each one as an Android drawable resource
 * so the generated Kotlin can render the actual designed image (painter
 * Resource(R.drawable.<name>)) instead of a gray placeholder Box.
 *
 * Drawable name rules: [a-z][a-z0-9_]+. We derive a stable name per screen
 * + image index so a re-run with the same html produces the same files
 * (and gradle's incremental build skips them).
 */

import * as fs from 'fs'
import * as path from 'path'

export interface ExtractedImage {
  /** R.drawable.<name> — the Kotlin reference. */
  drawableName: string
  /** Mime type of the source data URI (image/png, image/jpeg, image/webp). */
  mimeType: string
  /** Path of the written file inside app/src/main/res/drawable/. */
  filePath: string
  /** A short hint (alt text + nearby text) for the agent prompt mapping. */
  hint: string
  /** Original src attribute prefix (first 80 chars) — debug aid only. */
  srcPreview: string
}

export interface ExtractScreensResult {
  /** HTML with each extracted <img src="data:..."> rewritten to
   * `<img data-vs-drawable="<name>" alt="<original alt>">` so the agent
   * sees the marker and can map it back. */
  rewrittenHtmlByScreen: string[]
  /** Flat list of every drawable written (across all screens) — feeds the
   * mapping table in the codegen prompt. */
  images: ExtractedImage[]
}

const DATA_URI_RE = /<img\b[^>]*\bsrc=["'](data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([^"']+))["'][^>]*>/gi
const ALT_RE = /\balt=["']([^"']{0,80})["']/i

function safeName(raw: string): string {
  // Lowercase, alphanum + underscore only, must start with a letter.
  let n = raw.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  if (!n || !/^[a-z]/.test(n)) n = 'img_' + n
  if (n.length > 60) n = n.slice(0, 60)
  return n
}

function extFor(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'png'
}

/**
 * Process every screen's HTML; write extracted images under
 * `<projectDir>/app/src/main/res/drawable/`. Returns the rewritten HTML
 * (with stable markers replacing inline data URIs) plus the flat image
 * map for the codegen prompt.
 */
export function extractScreenImages(
  projectDir: string,
  screens: Array<{ name: string; html: string }>,
): ExtractScreensResult {
  const drawableDir = path.join(projectDir, 'app', 'src', 'main', 'res', 'drawable')
  if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true })

  // Wipe stale generated drawables (keep anything not prefixed `vs_`).
  for (const f of fs.readdirSync(drawableDir)) {
    if (f.startsWith('vs_')) {
      try { fs.unlinkSync(path.join(drawableDir, f)) } catch {}
    }
  }

  const images: ExtractedImage[] = []
  const rewrittenHtmlByScreen: string[] = []

  for (let si = 0; si < screens.length; si++) {
    const screen = screens[si]
    const screenSlug = safeName(`vs_s${si}_${screen.name}`)
    let imgIdx = 0
    const rewritten = screen.html.replace(DATA_URI_RE, (_full, _src, mime, b64, ...rest) => {
      const orig = rest[rest.length - 1] as string // full match again per replace API
      // Recover the full <img ...> tag to look up alt for hint.
      const tag = (typeof orig === 'string' ? orig : '')
      const altMatch = ALT_RE.exec(tag)
      const altText = altMatch?.[1]?.trim() || ''
      const drawableName = `${screenSlug}_img_${imgIdx}`
      const ext = extFor(String(mime).toLowerCase())
      const fname = `${drawableName}.${ext}`
      const filePath = path.join(drawableDir, fname)

      try {
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'))
        images.push({
          drawableName,
          mimeType: mime,
          filePath,
          hint: altText,
          srcPreview: `data:${mime};base64,${String(b64).slice(0, 32)}…`,
        })
      } catch (e: any) {
        // Decoding failed — leave the original in place so the agent at
        // least sees the placeholder.
        return _full
      }

      imgIdx += 1
      // Replace with a marker tag the agent can spot. Preserves alt for context.
      const altAttr = altText ? ` alt="${altText.replace(/"/g, '&quot;')}"` : ''
      return `<img data-vs-drawable="${drawableName}"${altAttr} />`
    })
    rewrittenHtmlByScreen.push(rewritten)
  }

  return { rewrittenHtmlByScreen, images }
}

/** Build the agent-facing mapping table appended to the codegen prompt. */
export function buildDrawableMappingPrompt(images: ExtractedImage[]): string {
  if (images.length === 0) return ''
  const rows = images.map((im) => {
    const hint = im.hint ? ` — ${im.hint}` : ''
    return `  R.drawable.${im.drawableName}  (${im.mimeType})${hint}`
  }).join('\n')
  return `

EXTRACTED IMAGE RESOURCES — written to app/src/main/res/drawable/. Wherever
the HTML has \`<img data-vs-drawable="<name>" ...>\` use that drawable as
the image source in your Composable:

${rows}

For each marker, render it with:
  Image(
    painter = painterResource(id = R.drawable.<name>),
    contentDescription = "<alt or null>",
    modifier = Modifier.size(<W>.dp, <H>.dp),  // size from CSS or layout
    contentScale = ContentScale.Crop,           // or Fit per design intent
  )

REQUIRED EXTRA IMPORTS for image rendering:
  import androidx.compose.foundation.Image
  import androidx.compose.ui.layout.ContentScale
  import androidx.compose.ui.res.painterResource

DO NOT replace these markers with placeholder Box — use the actual
painterResource so the user sees the designed image in the emulator.`
}
