/**
 * VibeSynth Database — File-backed JSON storage with SQLite-compatible API
 *
 * Stores projects, design systems, design guides, and user settings.
 * Uses the Electron app data directory for cross-platform persistence.
 *
 * Architecture:
 * - Data is stored as JSON files in the app data directory
 * - Each collection (projects, guides, settings) is a separate file
 * - The API is designed to be easily replaced with SQLite (sql.js or better-sqlite3)
 * - All operations are synchronous (like SQLite) for consistency
 *
 * Future migration path: Replace readCollection/writeCollection with SQLite calls
 */

import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// ─── Types ──────────────────────────────────────────────────────

export interface DBProject {
  id: string
  name: string
  prompt?: string
  deviceType: 'app' | 'web' | 'tablet'
  screens: DBScreen[]
  designSystem?: any // DesignSystem JSON
  designGuideId?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface DBScreen {
  id: string
  name: string
  html: string
}

export interface DBDesignGuide {
  id: string
  name: string
  keywords: string[]
  mood: string[]
  domains: string[]
  guide: any // DesignGuide JSON
  source: 'curated' | 'ai-generated' | 'user-edited'
  createdAt: string
  userId: string
}

export interface DBUserSettings {
  userId: string
  theme: 'light' | 'dark' | 'system'
  defaultProjectPath: string
  defaultFramework: string
  defaultDevPort: number
  geminiApiKey?: string
  defaultModel: string
  packageManager: string
  autoStartServer: boolean
  externalEditor: string
}

// ─── Database Class ─────────────────────────────────────────────

class VibeSynthDatabase {
  private dbDir: string
  private initialized = false

  constructor() {
    // Use Electron's app data directory
    this.dbDir = path.join(app?.getPath?.('userData') || '.', 'vibesynth-data')
  }

  private ensureInit() {
    if (this.initialized) return
    this.initialized = true
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true })
    }
  }

  private collectionPath(name: string): string {
    return path.join(this.dbDir, `${name}.json`)
  }

  private readCollection<T>(name: string): T[] {
    this.ensureInit()
    const filePath = this.collectionPath(name)
    if (!fs.existsSync(filePath)) return []
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw) as T[]
    } catch {
      return []
    }
  }

  private writeCollection<T>(name: string, data: T[]) {
    this.ensureInit()
    fs.writeFileSync(this.collectionPath(name), JSON.stringify(data, null, 2), 'utf-8')
  }

  // ─── Projects ───────────────────────────────────────────────

  getAllProjects(userId: string): DBProject[] {
    return this.readCollection<DBProject>('projects').filter(p => p.userId === userId)
  }

  getProject(id: string): DBProject | undefined {
    return this.readCollection<DBProject>('projects').find(p => p.id === id)
  }

  saveProject(project: DBProject) {
    const projects = this.readCollection<DBProject>('projects')
    const idx = projects.findIndex(p => p.id === project.id)
    if (idx >= 0) {
      projects[idx] = project
    } else {
      projects.push(project)
    }
    this.writeCollection('projects', projects)
  }

  deleteProject(id: string) {
    const projects = this.readCollection<DBProject>('projects').filter(p => p.id !== id)
    this.writeCollection('projects', projects)
  }

  // ─── Design Guides ─────────────────────────────────────────

  getAllGuides(userId: string): DBDesignGuide[] {
    return this.readCollection<DBDesignGuide>('guides').filter(
      g => g.userId === userId || g.source === 'curated'
    )
  }

  getGuide(id: string): DBDesignGuide | undefined {
    return this.readCollection<DBDesignGuide>('guides').find(g => g.id === id)
  }

  saveGuide(guide: DBDesignGuide) {
    const guides = this.readCollection<DBDesignGuide>('guides')
    const idx = guides.findIndex(g => g.id === guide.id)
    if (idx >= 0) {
      guides[idx] = guide
    } else {
      guides.push(guide)
    }
    this.writeCollection('guides', guides)
  }

  findMatchingGuide(prompt: string, userId: string): DBDesignGuide | null {
    const guides = this.getAllGuides(userId)
    const words = prompt.toLowerCase().split(/\s+/)

    let bestScore = 0
    let bestGuide: DBDesignGuide | null = null

    for (const guide of guides) {
      let score = 0
      const terms = [...guide.keywords, ...guide.domains, ...guide.mood]

      for (const term of terms) {
        for (const word of words) {
          if (word.includes(term) || term.includes(word)) {
            score += word === term ? 3 : 1
          }
        }
      }

      for (const domain of guide.domains) {
        if (prompt.toLowerCase().includes(domain)) score += 5
      }

      if (score > bestScore) {
        bestScore = score
        bestGuide = guide
      }
    }

    return bestScore >= 3 ? bestGuide : null
  }

  // ─── User Settings ─────────────────────────────────────────

  getSettings(userId: string): DBUserSettings {
    const allSettings = this.readCollection<DBUserSettings>('settings')
    const existing = allSettings.find(s => s.userId === userId)
    if (existing) return existing

    // Default settings
    return {
      userId,
      theme: 'system',
      defaultProjectPath: '~/VibeSynth/projects',
      defaultFramework: 'React + Vite',
      defaultDevPort: 5173,
      defaultModel: '3.0 Flash',
      packageManager: 'npm',
      autoStartServer: true,
      externalEditor: 'VS Code',
    }
  }

  saveSettings(settings: DBUserSettings) {
    const allSettings = this.readCollection<DBUserSettings>('settings')
    const idx = allSettings.findIndex(s => s.userId === settings.userId)
    if (idx >= 0) {
      allSettings[idx] = settings
    } else {
      allSettings.push(settings)
    }
    this.writeCollection('settings', allSettings)
  }

  // ─── Utility ───────────────────────────────────────────────

  getDbPath(): string {
    this.ensureInit()
    return this.dbDir
  }
}

// ─── Singleton ──────────────────────────────────────────────────

export const db = new VibeSynthDatabase()
