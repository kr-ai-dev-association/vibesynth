/**
 * Gemini CLI Integration
 *
 * Uses the Gemini CLI (`gemini -p`) in headless mode for:
 * - Structured file generation (React components, project scaffolding)
 * - Code editing with file context
 * - Build error fixing
 *
 * This is preferred over the JS SDK for file-heavy tasks because:
 * - CLI has built-in file I/O and sandboxing
 * - Better structured JSON output for code generation
 * - Can process larger contexts (1M token window)
 * - More reliable for code generation than SDK responseMimeType
 *
 * Requires: npm install -g @google/gemini-cli
 */

import { execSync, exec } from 'child_process'
import path from 'path'
import fs from 'fs'

// Check if Gemini CLI is installed
let geminiAvailable: boolean | null = null

export function isGeminiCliAvailable(): boolean {
  if (geminiAvailable !== null) return geminiAvailable
  try {
    execSync('gemini --version', { stdio: 'pipe', timeout: 5000 })
    geminiAvailable = true
  } catch {
    geminiAvailable = false
  }
  return geminiAvailable
}

/**
 * Run Gemini CLI in headless mode and return the response.
 */
export async function runGeminiCli(
  prompt: string,
  options?: {
    outputFormat?: 'json' | 'text'
    timeout?: number
    cwd?: string
  },
): Promise<string> {
  const format = options?.outputFormat === 'json' ? '--output-format json' : ''
  const timeout = options?.timeout || 120_000

  return new Promise((resolve, reject) => {
    const escapedPrompt = prompt.replace(/'/g, "'\\''")
    const cmd = `gemini -p '${escapedPrompt}' ${format}`

    exec(cmd, {
      cwd: options?.cwd,
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: { ...process.env, GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY },
    }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`Gemini CLI failed: ${err.message}\nStderr: ${stderr}`))
        return
      }
      resolve(stdout.trim())
    })
  })
}

/**
 * Generate React component files using Gemini CLI.
 * Writes prompts to a temp file for large contexts.
 */
export async function generateFilesWithCli(
  prompt: string,
  outputDir: string,
  options?: { timeout?: number },
): Promise<Record<string, string>> {
  // Write prompt to temp file for large inputs
  const tmpPromptFile = path.join(outputDir, '.vibesynth-prompt.txt')
  fs.writeFileSync(tmpPromptFile, prompt, 'utf-8')

  try {
    const result = await runGeminiCli(
      `Read the prompt from ${tmpPromptFile} and generate the requested files. ` +
      `Return ONLY a JSON object mapping file paths to file contents: {"path": "content", ...}. ` +
      `No markdown, no explanation, ONLY the JSON.`,
      { outputFormat: 'json', timeout: options?.timeout || 180_000, cwd: outputDir },
    )

    // Parse JSON response
    let parsed: any
    try {
      const jsonResult = JSON.parse(result)
      parsed = jsonResult.response ? JSON.parse(jsonResult.response) : jsonResult
    } catch {
      // Try to extract JSON from raw text
      const braceStart = result.indexOf('{')
      const braceEnd = result.lastIndexOf('}')
      if (braceStart !== -1 && braceEnd > braceStart) {
        parsed = JSON.parse(result.slice(braceStart, braceEnd + 1))
      } else {
        throw new Error('Failed to parse Gemini CLI output as JSON')
      }
    }

    const files: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      files[key] = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    }
    return files
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(tmpPromptFile) } catch { /* ignore */ }
  }
}
