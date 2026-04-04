/**
 * Frontend Builder Module
 *
 * Generates React+Vite+Tailwind projects from HTML screens.
 * Separated from gemini.ts for maintainability.
 *
 * Exports:
 * - generateFrontendApp: full build from HTML screens
 * - generateIncrementalFrontend: incremental build (new/changed screens only)
 * - editFrontendFile: edit a single file via AI
 * - hashString: simple string hash for cache comparison
 * - slugify: URL-safe slug from screen name
 */

// Re-export from gemini.ts (functions remain there for backward compatibility)
export {
  generateFrontendApp,
  generateIncrementalFrontend,
  editFrontendFile,
  hashString,
  slugify,
} from './gemini'
