/**
 * Build Error Fixer Module
 *
 * Automatically diagnoses and fixes build/compile errors
 * in generated React+Vite projects using AI.
 *
 * Separated from gemini.ts for maintainability.
 *
 * Exports:
 * - fixBuildErrors: analyze error output + project files → return fixed files
 */

// Re-export from gemini.ts (function remains there for backward compatibility)
export { fixBuildErrors } from './gemini'
