/**
 * Design Guide Database System
 *
 * Stores and retrieves design guides based on app domain/mood keywords.
 * Guides are matched to prompts automatically based on keyword analysis.
 *
 * Architecture:
 * - In-memory keyword-indexed store (future: IndexedDB / SQLite)
 * - Pre-seeded with curated guides for common app domains
 * - AI-generated guides are saved back for future reuse
 * - Keyword matching scores prompts against stored guides
 */

import type { DesignGuide } from '../App'

// ─── Guide Entry ────────────────────────────────────────────────

export interface DesignGuideEntry {
  id: string
  name: string
  keywords: string[]         // Match keywords for automatic mapping
  mood: string[]             // Visual mood tags: "dark", "minimal", "playful", etc.
  domains: string[]          // App domain tags: "fitness", "food", "travel", etc.
  guide: DesignGuide
  createdAt: string
  source: 'curated' | 'ai-generated' | 'user-edited'
}

// ─── Guide Store ────────────────────────────────────────────────

const STORAGE_KEY = 'vibesynth-design-guides'

class DesignGuideStore {
  private entries: DesignGuideEntry[] = []
  private loaded = false

  private load() {
    if (this.loaded) return
    this.loaded = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        this.entries = JSON.parse(raw)
      }
    } catch {
      this.entries = []
    }
    // Merge curated guides (always available)
    for (const curated of CURATED_GUIDES) {
      if (!this.entries.find(e => e.id === curated.id)) {
        this.entries.push(curated)
      }
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries))
    } catch (e) {
      console.warn('[VibeSynth] Failed to save design guides:', e)
    }
  }

  getAll(): DesignGuideEntry[] {
    this.load()
    return [...this.entries]
  }

  getById(id: string): DesignGuideEntry | undefined {
    this.load()
    return this.entries.find(e => e.id === id)
  }

  /**
   * Find the best matching guide for a given prompt.
   * Uses keyword scoring against domains, mood, and keywords fields.
   */
  findBestMatch(prompt: string): DesignGuideEntry | null {
    this.load()
    const words = prompt.toLowerCase().split(/\s+/)

    let bestScore = 0
    let bestEntry: DesignGuideEntry | null = null

    for (const entry of this.entries) {
      let score = 0
      const allTerms = [...entry.keywords, ...entry.domains, ...entry.mood]

      for (const term of allTerms) {
        for (const word of words) {
          if (word.includes(term) || term.includes(word)) {
            score += word === term ? 3 : 1 // Exact match scores higher
          }
        }
      }

      // Bonus for domain match
      for (const domain of entry.domains) {
        if (prompt.toLowerCase().includes(domain)) {
          score += 5
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestEntry = entry
      }
    }

    return bestScore >= 3 ? bestEntry : null
  }

  /**
   * Save an AI-generated or user-edited guide back to the store.
   */
  upsert(entry: DesignGuideEntry) {
    this.load()
    const idx = this.entries.findIndex(e => e.id === entry.id)
    if (idx >= 0) {
      this.entries[idx] = entry
    } else {
      this.entries.push(entry)
    }
    this.save()
  }

  /**
   * Save an AI-generated guide from a design system extraction.
   */
  saveFromGeneration(
    projectName: string,
    prompt: string,
    guide: DesignGuide,
  ): DesignGuideEntry {
    const keywords = extractKeywords(prompt)
    const mood = detectMood(prompt)
    const domains = detectDomains(prompt)

    const entry: DesignGuideEntry = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${projectName} Guide`,
      keywords,
      mood,
      domains,
      guide,
      createdAt: new Date().toISOString(),
      source: 'ai-generated',
    }

    this.upsert(entry)
    return entry
  }

  delete(id: string) {
    this.load()
    this.entries = this.entries.filter(e => e.id !== id)
    this.save()
  }
}

// ─── Singleton Export ───────────────────────────────────────────

export const designGuideDB = new DesignGuideStore()

// ─── Keyword Extraction ─────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
  'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
  'app', 'page', 'screen', 'design', 'create', 'make', 'show', 'display',
  'include', 'featuring', 'mobile', 'web', 'desktop', 'tablet',
])

function extractKeywords(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 15)
}

function detectMood(prompt: string): string[] {
  const p = prompt.toLowerCase()
  const moods: string[] = []

  const moodMap: [string[], string][] = [
    [['dark', 'night', 'moody', 'noir', 'black'], 'dark'],
    [['light', 'bright', 'clean', 'white', 'minimal'], 'light'],
    [['playful', 'fun', 'colorful', 'vibrant', 'bold'], 'playful'],
    [['elegant', 'luxury', 'premium', 'sophisticated'], 'elegant'],
    [['warm', 'cozy', 'earthy', 'organic', 'natural'], 'warm'],
    [['cool', 'tech', 'modern', 'futuristic', 'neon'], 'tech'],
    [['pastel', 'soft', 'gentle', 'dreamy'], 'pastel'],
    [['retro', 'vintage', 'classic', 'nostalgic'], 'retro'],
  ]

  for (const [keywords, mood] of moodMap) {
    if (keywords.some(kw => p.includes(kw))) moods.push(mood)
  }

  return moods.length > 0 ? moods : ['modern']
}

function detectDomains(prompt: string): string[] {
  const p = prompt.toLowerCase()
  const domains: string[] = []

  const domainMap: [string[], string][] = [
    [['fitness', 'workout', 'gym', 'exercise', 'health', 'training'], 'fitness'],
    [['food', 'recipe', 'cook', 'restaurant', 'meal', 'pizza', 'kitchen'], 'food'],
    [['travel', 'destination', 'trip', 'vacation', 'hotel', 'booking'], 'travel'],
    [['music', 'audio', 'podcast', 'playlist', 'streaming', 'song'], 'music'],
    [['shop', 'store', 'ecommerce', 'marketplace', 'product', 'cart'], 'ecommerce'],
    [['social', 'chat', 'message', 'community', 'feed', 'profile'], 'social'],
    [['finance', 'bank', 'money', 'budget', 'payment', 'crypto'], 'finance'],
    [['education', 'learn', 'course', 'quiz', 'study', 'language'], 'education'],
    [['plant', 'garden', 'nature', 'outdoor', 'green'], 'nature'],
    [['dashboard', 'analytics', 'data', 'saas', 'admin', 'crm'], 'productivity'],
    [['magazine', 'news', 'article', 'blog', 'read', 'content'], 'media'],
    [['cocktail', 'drink', 'bar', 'wine', 'beer', 'cafe'], 'beverage'],
    [['ski', 'sport', 'game', 'league', 'team', 'score'], 'sports'],
  ]

  for (const [keywords, domain] of domainMap) {
    if (keywords.some(kw => p.includes(kw))) domains.push(domain)
  }

  return domains.length > 0 ? domains : ['general']
}

// ─── Curated Guides (Ported from Stitch reference outputs) ─────
//
// These guides are reverse-engineered from actual Stitch-generated
// designs visible in the reference screenshots (screenshots/11-*.png,
// screenshots/34-*.png, etc.). Each guide captures the exact color
// tokens, typography stacks, elevation patterns, and component rules
// that Stitch applied for a given prompt domain.

const CURATED_GUIDES: DesignGuideEntry[] = [
  // ────────────────────────────────────────────────────────────────
  // FROM: Stitch "fitness tracking app" generation (screenshots 11-15)
  // Prompt: "A modern fitness tracking app with workout plans, progress
  //          charts, and social features. Use a dark theme with vibrant
  //          green accents."
  // ────────────────────────────────────────────────────────────────
  {
    id: 'stitch-kinetic-volt',
    name: 'Kinetic Volt (Stitch Fitness)',
    keywords: ['workout', 'strength', 'muscle', 'cardio', 'progress', 'tracker', 'stats', 'kinetic', 'fitness', 'gym', 'exercise', 'training'],
    mood: ['dark', 'tech'],
    domains: ['fitness'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `"Kinetic Volt" — Stitch's signature dark-fitness design language. A jet-black canvas punctuated by chartreuse/neon-yellow (#D4FF00) accents creates a high-energy, data-dense atmosphere. The system pairs oversized display numbers for metrics with gritty lifestyle photography of gym environments, delivering the visual intensity of a premium fitness brand like Whoop or Peloton.`,

      colorRules: `Surface hierarchy (exact Stitch tokens):
• Canvas/base: #0A0A0A (near-true-black)
• Card surface: #141414
• Elevated/hover: #1C1C1C
• Input/field background: #111111

Accent: Chartreuse #D4FF00 (Stitch "Kinetic Volt" primary). Used ONLY for:
  - CTA button backgrounds (with #0A0A0A text)
  - Active bottom-nav icon fill
  - Progress bar fills
  - Key stat numbers that need emphasis

Secondary accent: #A0A000 (muted olive-yellow) for secondary chips, tags.
Tertiary: #1A1A2E (deep navy) for subtle card tints where variety is needed.

Text: #FFFFFF headings, #B0B0B0 body, #666666 captions/metadata.
Error: #FF4444. Success: #D4FF00 (same as accent — success IS energy).

CRITICAL: Never use #D4FF00 for backgrounds or large fills — it is a spark, not a surface.`,

      typographyRules: `Stitch uses a geometric/grotesk sans-serif stack throughout:
• Display/hero metrics: 48-64px, font-weight 800, letter-spacing -0.03em, #FFFFFF or #D4FF00
  — Example: "84%", "2,480", "184.5 LBS" — these dominate the visual hierarchy
• Section headers: "EXPLORE PLANS", "TOTAL KINETIC OUTPUT" — 14-16px, uppercase, letter-spacing 0.12em, font-weight 700, #B0B0B0
• Card titles: 18-22px, font-weight 700, normal case, #FFFFFF
  — Example: "MAIN CIRCUIT HYPERMUSCLE STRENGTH", "Zen Kinetics"
• Body text: 13-14px, font-weight 400, line-height 1.5, #B0B0B0
• Metadata/labels: 11-12px, font-weight 500, #666666

Import: @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap')
Use Space Grotesk for the entire UI. Its monospaced-adjacent proportions give the "data terminal" feel Stitch achieves.`,

      elevationRules: `Stitch avoids box-shadows entirely on dark surfaces. Depth is communicated through:
• Tonal stacking: place #141414 cards on #0A0A0A canvas
• Subtle borders: 1px solid rgba(255,255,255,0.06) on card edges — a "ghost border" glint
• Accent glow for active states: box-shadow 0 0 24px rgba(212,255,0,0.12) on selected cards
• Photo overlays: linear-gradient(to bottom, transparent 30%, #0A0A0A 100%) over lifestyle images to anchor text
• No drop shadows, no blur shadows — the design is flat-with-tonal-depth.`,

      componentRules: `Buttons:
• Primary CTA: background #D4FF00, color #0A0A0A, padding 14px 28px, border-radius 8px, font-weight 700, font-size 14px uppercase tracking 0.05em. Example: "START JOURNEY"
• Secondary: transparent, border 1px #333, color #FFFFFF, same sizing
• Chip toggles: background #1C1C1C, border 1px #333, color #B0B0B0, border-radius 999px, padding 8px 16px. Active: background #D4FF00, color #0A0A0A

Stat Cards (key Stitch pattern):
• Large number top (32-48px, bold, #FFFFFF or #D4FF00)
• Unit/label below (12px, uppercase, #666666)
• Subtle trend arrow + percentage
• Card: #141414, 16px radius, 20px padding, ghost border

Progress/Charts:
• Bar charts: #D4FF00 fill on #1C1C1C track, 8px height, rounded
• Weight tracking: line chart, #D4FF00 line 2px, dots at data points
• Circular progress: #D4FF00 stroke, #1C1C1C track, percentage centered

Bottom Navigation:
• 5 items, #141414 background, icons 24px
• Active: icon filled #D4FF00 + 2px underline bar
• Inactive: icon outline #666666

Photo Integration (critical Stitch differentiator):
• Lifestyle photos of gym/workout environments, not placeholders
• Photos always have gradient overlay anchoring text
• Photo containers: border-radius 12-16px, overflow hidden
• Use {{HERO_IMAGE}}, {{CONTENT_IMAGE_1}}, {{CONTENT_IMAGE_2}} placeholders

Search Bar: background #111111, border-radius 12px, placeholder #666666, no border, height 44px`,

      dosAndDonts: `DO: Make stat numbers the dominant visual element — Stitch renders "84%", "2,480", "184.5" as the biggest items on screen.
DO: Use lifestyle photography with gradient overlays (not solid color placeholders) for hero sections and feature cards.
DO: Maintain the chartreuse accent as a precise tool — buttons, active states, key numbers, nothing else.
DON'T: Use any background lighter than #1C1C1C — this system is true-dark, not "dark grey".
DON'T: Add borders to cards thicker than 1px or more opaque than 8% white.
DON'T: Use rounded/playful fonts — Space Grotesk's geometric tension is the personality.`,
    },
  },

  // ────────────────────────────────────────────────────────────────
  // FROM: Stitch "Indoor Plant Care Dashboard" example (screenshot 34)
  // ────────────────────────────────────────────────────────────────
  {
    id: 'stitch-plant-care',
    name: 'Botanical Care (Stitch Plant)',
    keywords: ['plant', 'garden', 'indoor', 'watering', 'botanical', 'care', 'nature', 'green', 'leaf'],
    mood: ['light', 'warm'],
    domains: ['nature'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `"Botanical Care" — Stitch's clean light-mode design for plant/nature apps. A bright white canvas with fresh green accents, real plant photography, and a task-oriented table layout. The system feels like a well-organized greenhouse dashboard — functional, calm, and alive with greenery.`,

      colorRules: `Surface hierarchy:
• Background: #FFFFFF
• Card/section: #FFFFFF (elevated by shadow, not tint)
• Table header background: #F9FAFB
• Sidebar/secondary: #F5F5F5

Primary accent: Fresh green #4CAF50 (for "Add New Plant" CTA, active icons)
Secondary: Soft green tint #E8F5E9 for subtle highlights
Tertiary: Warm amber #F59E0B for fertilization/alert indicators

Text: #1A1A1A headings, #4B5563 body, #9CA3AF metadata
Borders: #E5E7EB for table dividers and card edges

CRITICAL: Keep the palette predominantly white with green as the single accent. Stitch used NO dark surfaces.`,

      typographyRules: `Stitch used a clean sans-serif stack (Inter/system font):
• Page title: "My Plants" — 28px, font-weight 700, #1A1A1A
• Section headers: "🌿 Upcoming Tasks", "🌺 All Plants" — 18px, font-weight 600 with emoji prefix
• Table headers: "PLANT", "WATERING", "SUNLIGHT", "FERTILIZATION" — 12px, uppercase, letter-spacing 0.05em, font-weight 600, #9CA3AF
• Table body: 14px, font-weight 400, #4B5563
• Plant card labels: "Fiddle Leaf Fig", "Snake Plant" — 14px font-weight 600
• Plant card metadata: "Water in 3 days" — 12px, #9CA3AF

Import: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')`,

      elevationRules: `Stitch uses subtle shadows for card elevation on the white background:
• Main content card: box-shadow 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
• Plant photo cards: box-shadow 0 4px 12px rgba(0,0,0,0.06), border-radius 12px
• No dark shadows — everything is airy and light
• Table rows: no shadow, separated by 1px #E5E7EB border-bottom`,

      componentRules: `Top bar: left logo "🌿 Plant Care", center search bar (rounded, #F5F5F5 bg, placeholder "Search plants..."), right: notification bell + user avatar (40px circle)

CTA button: "Add New Plant" — background #4CAF50, color white, padding 10px 20px, border-radius 8px, font-weight 600, positioned at top-right of "My Plants" section

Task table (key Stitch pattern):
• Columns: Plant name, Watering (e.g. "in 2 days"), Sunlight ("Bright, indirect"), Fertilization ("in 3 weeks")
• Row height: 56px, vertical alignment center
• Plant names: 14px semibold, clickable

Plant cards grid:
• 4 columns, gap 16px
• Card: white bg, 12px radius, overflow hidden
• Photo: 100% width, 160px height, object-fit cover, REAL plant photos
• Below photo: plant name (14px bold), care info ("Water in 3 days", 12px #9CA3AF with 💧 icon)
• Use {{HERO_IMAGE}}, {{CONTENT_IMAGE_1}}, {{CONTENT_IMAGE_2}} for plant photos`,

      dosAndDonts: `DO: Use REAL plant photography (Stitch showed actual Fiddle Leaf Fig, Snake Plant, Monstera photos).
DO: Organize data in clean tables with proper column headers — this is a dashboard, not a gallery.
DO: Use emoji as section markers (🌿, 🌺, 💧) — Stitch included them naturally.
DON'T: Use dark backgrounds — this is a bright, clean, greenhouse aesthetic.
DON'T: Use decorative gradients or complex visual effects.
DON'T: Forget the task-management aspect — watering schedules and care timelines are core UI.`,
    },
  },

  // ────────────────────────────────────────────────────────────────
  // FROM: Stitch blue-accent variant (screenshot 15)
  // Same fitness app re-themed with blue instead of chartreuse
  // ────────────────────────────────────────────────────────────────
  {
    id: 'stitch-kinetic-blue',
    name: 'Kinetic Blue (Stitch Fitness Alt)',
    keywords: ['workout', 'fitness', 'gym', 'blue', 'exercise', 'training', 'health'],
    mood: ['dark', 'tech'],
    domains: ['fitness'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Blue variant of Stitch's Kinetic design system. Replaces chartreuse with electric blue (#3B82F6) while maintaining the same jet-black canvas and data-dense layout. This demonstrates how Stitch handles accent color swaps — the entire system re-themes coherently.`,

      colorRules: `Identical surface hierarchy to Kinetic Volt:
• Canvas: #0A0A0A, Cards: #141414, Elevated: #1C1C1C
Accent changed to: Electric blue #3B82F6 (replaces #D4FF00 everywhere)
Secondary blue: #1D4ED8 for darker blue states
Text hierarchy unchanged: #FFFFFF / #B0B0B0 / #666666`,

      typographyRules: `Same as Kinetic Volt — Space Grotesk, same size/weight hierarchy. Only the color of accent-colored text changes from #D4FF00 to #3B82F6 for emphasized metrics.`,

      elevationRules: `Same as Kinetic Volt, but glow color changes: box-shadow 0 0 24px rgba(59,130,246,0.15) for active states.`,

      componentRules: `All components identical to Kinetic Volt with blue accent swap:
• CTA: background #3B82F6, color #FFFFFF (white text on blue, not dark text)
• Active nav icon: #3B82F6 fill
• Progress bars: #3B82F6 fill
• Stat number highlights: #3B82F6 when accent-colored`,

      dosAndDonts: `DO: Apply the blue accent universally — every place that was chartreuse becomes blue.
DO: Keep text on blue buttons as white (unlike chartreuse which used black text).
DO: Maintain all other design tokens exactly as Kinetic Volt.
DON'T: Mix blue and green accents.
DON'T: Change the dark surface hierarchy.
DON'T: Alter the typography or spacing — only the accent hue changes.`,
    },
  },

  // ────────────────────────────────────────────────────────────────
  // Additional domain guides (derived from Stitch's design patterns)
  // ────────────────────────────────────────────────────────────────
  {
    id: 'stitch-warm-culinary',
    name: 'Warm Culinary (Stitch Food)',
    keywords: ['recipe', 'ingredient', 'cooking', 'kitchen', 'chef', 'meal', 'dish', 'food', 'pizza', 'restaurant'],
    mood: ['warm', 'elegant'],
    domains: ['food'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Warm culinary aesthetic matching Stitch's food app output style. Rich photography is the hero, complemented by earthy tones and elegant serif headings. The interface evokes a premium cookbook — tactile, appetizing, and photo-forward.`,
      colorRules: `Background: warm white #FFF9F5 or cream #FAF5F0. Cards: #FFFFFF with warm shadows. Primary: terracotta #C75B39. Secondary: golden amber #D4A574. Text: warm dark #2C1810 headings, #6B5B50 body. No cool greys — every neutral is warm-shifted.`,
      typographyRules: `Headline: Playfair Display or Libre Baskerville (serif) at 24-32px for recipe titles. Body: Inter or DM Sans at 14-16px. Recipe metadata (time, servings): 12px medium, uppercase with 0.05em tracking. Import both serif + sans-serif from Google Fonts.`,
      elevationRules: `Warm shadows only: 0 2px 8px rgba(44,24,16,0.06), 0 8px 24px rgba(44,24,16,0.04). Photo cards: 12-16px radius, overflow hidden. Hero images bleed to edges or use generous radius.`,
      componentRules: `Recipe cards: large photo (60% of card), serif title below, meta info in sans-serif. Ingredient chips: pill-shaped, cream bg, warm border. Step indicators: numbered circles in terracotta. Use {{HERO_IMAGE}} for food hero shots, {{CONTENT_IMAGE_1}}/{{CONTENT_IMAGE_2}} for ingredient/step photos.`,
      dosAndDonts: `DO: Let food photography dominate. DO: Use serif fonts for dish names. DO: Keep the palette warm. DON'T: Use cool blues or greys. DON'T: Overcrowd with text. DON'T: Use small photos.`,
    },
  },
  {
    id: 'stitch-dreamy-travel',
    name: 'Dreamy Travel (Stitch Travel)',
    keywords: ['destination', 'explore', 'adventure', 'trip', 'romantic', 'scenic', 'beach', 'travel', 'vacation', 'hotel'],
    mood: ['elegant', 'pastel'],
    domains: ['travel'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Aspirational photography-driven design matching Stitch's travel app style. Large immersive imagery with soft gradient overlays, dreamy tones, and clean bold sans-serif headings. The UI gets out of the way so destinations sell themselves.`,
      colorRules: `Background: soft white #FAFAFA. Primary: ocean blue #2563EB or coral #F97316. Hero overlays: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%). Cards: white, subtle shadow. Text on images: white with text-shadow 0 1px 4px rgba(0,0,0,0.5).`,
      typographyRules: `Headline: Plus Jakarta Sans or Outfit, 28-36px bold for destination names. Body: 14-16px regular. Price/booking: semibold, larger. Location: 12px medium with map-pin SVG icon. Import: @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap')`,
      elevationRules: `Photo cards: 16px radius, shadow 0 4px 16px rgba(0,0,0,0.08). Floating booking bar: backdrop-blur(16px) + white 90% opacity bg. Destination cards may slightly overlap for parallax depth.`,
      componentRules: `Destination cards: full-bleed photo with overlay gradient + destination name + star rating at bottom. Booking CTA: primary color, 48px height, full-width. Filter chips: horizontal scroll, pill-shaped. Use {{HERO_IMAGE}} for stunning landscape hero, {{CONTENT_IMAGE_1}}/{{CONTENT_IMAGE_2}} for destination cards.`,
      dosAndDonts: `DO: Use full-bleed large photography. DO: Keep UI minimal — destinations are the star. DO: Use warm color grading. DON'T: Clutter with UI. DON'T: Use small photos. DON'T: Use cold corporate palettes.`,
    },
  },
  {
    id: 'stitch-clean-saas',
    name: 'Clean SaaS (Stitch Dashboard)',
    keywords: ['dashboard', 'analytics', 'saas', 'admin', 'management', 'platform', 'startup', 'landing'],
    mood: ['light', 'tech'],
    domains: ['productivity'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Clean professional interface matching Stitch's SaaS dashboard output. Neutral palette with a single vibrant accent (indigo), clear data hierarchy, and purposeful whitespace. Communicates reliability and enterprise-grade polish.`,
      colorRules: `Background: #FAFAFA or white. Sidebar: #111827 dark. Primary: indigo #6366F1. Success: #10B981. Warning: #F59E0B. Error: #EF4444. Card borders: #E5E7EB. Text: #111827 headings, #6B7280 body.`,
      typographyRules: `Font: Inter exclusively. Headings: 20-28px semibold. Body: 14px regular. Data labels: 12px medium #6B7280. Numbers: tabular-nums feature. Section titles: 14px semibold uppercase tracking. Import: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')`,
      elevationRules: `Cards: border 1px #E5E7EB, shadow 0 1px 2px rgba(0,0,0,0.05) max. Modals: 0 4px 16px rgba(0,0,0,0.08). No heavy shadows — the design is flat and clean.`,
      componentRules: `Stat cards: number 24-28px bold + label 12px + trend % with colored arrow. Tables: minimal borders, alternate row bg. Buttons: 8px radius, primary solid indigo + secondary outline + ghost. Sidebar nav: icon + label, active = indigo background tint.`,
      dosAndDonts: `DO: Prioritize data readability. DO: Use 8px grid spacing. DO: Keep accent for actions only. DON'T: Use decorative gradients. DON'T: Overcrowd dashboards. DON'T: Mix accent colors.`,
    },
  },
  {
    id: 'stitch-moody-bar',
    name: 'Moody Mixology (Stitch Bar)',
    keywords: ['cocktail', 'bar', 'drink', 'wine', 'spirits', 'recipe', 'mixology', 'beer', 'cafe'],
    mood: ['dark', 'elegant'],
    domains: ['beverage'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Sophisticated dark aesthetic for cocktail/beverage apps matching Stitch's premium bar output. Deep warm blacks with amber/gold accents. Photography is dramatically lit with rich, deep tones like a craft cocktail bar.`,
      colorRules: `Background: #0C0A09 base, #1C1917 cards, #292524 elevated. Accent: warm amber #F59E0B or gold #D4A574. Secondary: burgundy #7F1D1D. Text: #FAFAF9 headings, #A8A29E body.`,
      typographyRules: `Headline: Libre Baskerville (serif) at 24-28px or DM Sans at same size. Body: 14px warm grey. Import serif from Google Fonts. Cocktail names should feel editorial and elegant.`,
      elevationRules: `Warm ambient glow on hero images. Cards: 1px border rgba(255,255,255,0.05). No cold shadows — warm-tinted or none.`,
      componentRules: `Recipe cards: dark card, large moody photo, elegant cocktail name, difficulty/time badges. Ingredient pills: dark bg, warm border. Use {{HERO_IMAGE}} for dramatic cocktail photo, {{CONTENT_IMAGE_1}} for ingredients flat-lay.`,
      dosAndDonts: `DO: Use dramatic moody photography. DO: Keep palette warm and dark. DO: Use accent sparingly like candlelight. DON'T: Use bright backgrounds. DON'T: Make it generic. DON'T: Overuse amber — subtlety is key.`,
    },
  },
  {
    id: 'stitch-playful-social',
    name: 'Playful Social (Stitch Social)',
    keywords: ['social', 'community', 'chat', 'friends', 'share', 'post', 'feed', 'story', 'message'],
    mood: ['playful', 'light'],
    domains: ['social'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Vibrant engaging design matching Stitch's social app output. Rounded shapes, cheerful gradient accents, and avatar-centric layouts. Feels friendly and encourages interaction.`,
      colorRules: `Background: #FFFFFF with subtle tinted sections (#F0F7FF, #FFF7F0). Primary: purple #7C3AED or blue #3B82F6. Gradient CTAs: linear-gradient(135deg, #7C3AED, #2563EB). Like/heart: pink #EC4899.`,
      typographyRules: `Font: Inter or Nunito. Usernames: 14px semibold. Post text: 15px regular line-height 1.6. Timestamps: 12px #9CA3AF. Engagement counts: 13px semibold. Import: @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap')`,
      elevationRules: `Cards: 16px radius, shadow 0 2px 8px rgba(0,0,0,0.06). Avatars: 40-48px feed, 80-120px profiles. Stories: 2px gradient ring. Compose FAB: large shadow + gradient bg.`,
      componentRules: `Post cards: avatar + name + timestamp header, content, engagement bar (like/comment/share icons + counts). Stories: horizontal scroll circles with gradient rings. Bottom nav: 5 items, center = accent compose button. Chat: colored bubbles.`,
      dosAndDonts: `DO: Make avatars/content the focus. DO: Use color for engagement actions. DO: Generous line-height. DON'T: Feel corporate. DON'T: Use sharp corners. DON'T: Let UI overshadow content.`,
    },
  },
  {
    id: 'stitch-education-fresh',
    name: 'Fresh Education (Stitch Learn)',
    keywords: ['education', 'learn', 'course', 'quiz', 'study', 'language', 'lesson', 'tutorial'],
    mood: ['light', 'playful'],
    domains: ['education'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Clean, encouraging design for education/learning apps. Bright palette with a strong primary blue and supportive green for progress/success. Cards-based layout with clear progress indicators and gamification elements.`,
      colorRules: `Background: #F8FAFC. Cards: #FFFFFF. Primary: blue #2563EB. Success/progress: green #10B981. Warning: orange #F59E0B. Error: red #EF4444. Progress tracks: #E2E8F0. Text: #0F172A headings, #64748B body.`,
      typographyRules: `Font: Inter or DM Sans, 14px body, 24-28px headings semibold. Quiz options: 16px medium. Score numbers: 32px+ bold. Progress labels: 12px medium. Import Inter from Google Fonts.`,
      elevationRules: `Cards: 12px radius, shadow 0 1px 3px rgba(0,0,0,0.06). Quiz option cards: 12px radius, border 2px transparent, selected = border 2px #2563EB. Progress bars: 8px height rounded.`,
      componentRules: `Lesson cards: progress ring + title + subtitle + "Continue" CTA. Quiz screen: question in large text, 4 option cards, progress bar top. Score screen: large number + confetti/celebration, "Next Lesson" CTA. Streak indicators: fire emoji + day count.`,
      dosAndDonts: `DO: Show clear progress everywhere. DO: Use encouraging colors (green for completion). DO: Keep interactions clear and tap-friendly. DON'T: Make it feel like a boring textbook. DON'T: Use tiny text. DON'T: Forget gamification elements.`,
    },
  },
  {
    id: 'stitch-finance-pro',
    name: 'Finance Pro (Stitch Finance)',
    keywords: ['finance', 'bank', 'money', 'budget', 'payment', 'crypto', 'wallet', 'investment', 'stock'],
    mood: ['dark', 'tech'],
    domains: ['finance'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Dark, trust-inspiring finance interface. Deep navy/black backgrounds with precise data displays, green/red for gain/loss, and minimal decorative elements. Every pixel serves a data purpose — like Bloomberg Terminal meets modern mobile.`,
      colorRules: `Background: #0B1121 (deep navy). Cards: #111827. Elevated: #1F2937. Gain/positive: #10B981. Loss/negative: #EF4444. Primary accent: #3B82F6 (blue for interactive). Text: #F9FAFB headings, #9CA3AF body, #6B7280 labels.`,
      typographyRules: `Font: Inter with tabular-nums. Balance/amount: 36-48px bold. Percentage changes: 16px semibold + colored. Transaction amounts: 16px medium. Labels: 12px regular #6B7280. Import Inter from Google Fonts.`,
      elevationRules: `Cards: 1px border rgba(255,255,255,0.06). No shadows on dark — use border + tonal layers. Chart areas: #111827 background with subtle grid lines #1F2937.`,
      componentRules: `Balance card: large amount top, +/- change below in green/red, sparkline chart. Transaction list: icon + name + date left, amount right (+green/-red). Portfolio: donut chart with legend. Quick actions: circular icon buttons with label below.`,
      dosAndDonts: `DO: Make money amounts the dominant visual element. DO: Use tabular-nums for alignment. DO: Color-code gain/loss consistently. DON'T: Use playful colors or rounded fonts. DON'T: Add decorative elements. DON'T: Compromise data density for aesthetics.`,
    },
  },

  // ────────────────────────────────────────────────────────────────
  // Bright / Vibrant / Light color guides
  // ────────────────────────────────────────────────────────────────
  {
    id: 'stitch-sunny-wellness',
    name: 'Sunny Wellness (Bright Health)',
    keywords: ['wellness', 'meditation', 'yoga', 'mindful', 'calm', 'sleep', 'mental', 'breathe', 'selfcare'],
    mood: ['light', 'pastel'],
    domains: ['fitness'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `A warm, sunlit wellness aesthetic. Soft peach and lavender pastels over clean white surfaces, with cheerful coral accents. The design radiates calm optimism — like morning sunlight through a yoga studio window. Rounded corners everywhere, generous whitespace, and gentle gradients.`,
      colorRules: `Background: warm white #FFFBF7. Cards: #FFFFFF. Section tints: peach #FFF5EE, lavender #F5F0FF, mint #F0FFF4.
Primary accent: coral #F97066 (CTAs, progress rings, highlights).
Secondary: soft purple #A78BFA. Tertiary: mint green #6EE7B7.
Text: warm charcoal #3D3535 headings, #78716C body, #A8A29E captions.
Gradients: linear-gradient(135deg, #FEC89A, #F97066) for hero cards, linear-gradient(135deg, #C4B5FD, #A78BFA) for secondary cards.
CRITICAL: No pure blacks, no dark backgrounds. Every surface is warm-shifted white or a soft pastel tint.`,
      typographyRules: `Font: Nunito (rounded letterforms match the soft aesthetic). Headlines: 28-32px bold. Body: 15px regular, line-height 1.6. Stats: 36px+ bold. Labels: 12px semibold uppercase, tracking 0.05em. Import: @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap')`,
      elevationRules: `Cards: 16px radius, shadow 0 4px 16px rgba(249,112,102,0.08). Hero cards: 24px radius with gradient background. Progress rings: 80-120px diameter, 8px stroke, coral fill on #F5F0FF track. No hard edges — everything rounded 12px minimum.`,
      componentRules: `Mood selector: row of emoji circles (😊 😌 😔 😤 😴) with active = coral ring. Progress ring: large centered, percentage inside, label below. Habit cards: icon + label + streak count, horizontal scroll. Daily quote: italic serif text in a pastel card. Bottom nav: 4 items, rounded pill shape, active = coral fill. CTA: coral gradient, white text, 48px height, full-width, 16px radius. Use {{HERO_IMAGE}} for serene nature/wellness photo.`,
      dosAndDonts: `DO: Use soft pastel tints for section backgrounds — each section a slightly different tint. DO: Make progress rings and stats the emotional center. DO: Use emoji naturally in headers and labels. DON'T: Use any dark or cold colors. DON'T: Use sharp corners (minimum 12px radius). DON'T: Create dense, data-heavy layouts — this is about calm.`,
    },
  },
  {
    id: 'stitch-pop-ecommerce',
    name: 'Pop Commerce (Vibrant Shop)',
    keywords: ['shop', 'store', 'ecommerce', 'marketplace', 'product', 'cart', 'fashion', 'buy', 'sale', 'clothing'],
    mood: ['playful', 'light'],
    domains: ['ecommerce'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Vibrant, energetic e-commerce aesthetic inspired by Gen-Z shopping apps. Electric violet and hot pink accents on clean white, with bold product photography and playful micro-interactions. The design screams "add to cart" with confidence and style.`,
      colorRules: `Background: #FFFFFF. Cards: #FFFFFF with colored shadows. Section tints: violet #F5F3FF, pink #FFF1F2.
Primary: electric violet #7C3AED (CTAs, active states). Secondary: hot pink #EC4899 (sale badges, likes). Tertiary: amber #F59E0B (ratings, stars).
Text: #0F172A headings, #475569 body, #94A3B8 captions.
Sale badges: background #FEF2F2, text #DC2626, border 1px #FECACA.
Gradient for hero: linear-gradient(135deg, #7C3AED, #EC4899).
CRITICAL: White base with bold pops of color — never muted or corporate.`,
      typographyRules: `Font: DM Sans for clean readability. Headlines: 24-28px bold. Product names: 16px semibold. Prices: 20px bold #0F172A, original price 14px line-through #94A3B8. Body: 14px regular. Import: @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap')`,
      elevationRules: `Product cards: 12px radius, shadow 0 2px 12px rgba(124,58,237,0.06). Floating cart button: 999px radius (circle), shadow 0 8px 24px rgba(124,58,237,0.2). Sale banner: slight tilt (-1deg) for playful energy.`,
      componentRules: `Product cards: square photo (1:1 ratio), heart icon top-right, badge top-left ("SALE -30%"), name + price + rating below. Add to cart: violet gradient, white text, 44px height, 12px radius. Size selector: row of circles, active = violet fill. Filter chips: horizontal scroll, pill-shaped, active = violet bg white text. Cart badge: pink circle with count. Category tabs: horizontal scroll, active = underline 3px violet. Use {{HERO_IMAGE}}/{{CONTENT_IMAGE_1}}/{{CONTENT_IMAGE_2}} for product photos.`,
      dosAndDonts: `DO: Use large, vibrant product photography. DO: Make prices bold and immediately visible. DO: Use color-coded badges for sale/new/trending. DON'T: Use muted or desaturated colors. DON'T: Make the design feel corporate or conservative. DON'T: Forget the urgency elements (sale badges, limited stock indicators).`,
    },
  },
  {
    id: 'stitch-garden-fresh',
    name: 'Garden Fresh (Light Nature)',
    keywords: ['plant', 'garden', 'organic', 'farm', 'fresh', 'green', 'leaf', 'sustainable', 'eco'],
    mood: ['light', 'warm'],
    domains: ['nature', 'food'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `A fresh, airy nature-inspired design. Leaf-green and warm terracotta on bright cream backgrounds, with botanical illustration accents. The aesthetic splits the difference between a farm-to-table restaurant menu and a premium garden center app.`,
      colorRules: `Background: cream #FEFCE8 or warm white #FEFDF5. Cards: #FFFFFF. Section tints: sage #F0FDF4, warm #FEF7ED.
Primary: leaf green #16A34A. Secondary: terracotta #C2410C. Tertiary: sky #38BDF8.
Text: forest #14532D headings, #3F6212 body, #84CC16 active labels.
Organic badge: background #F0FDF4, text #16A34A, border 1px #BBF7D0.`,
      typographyRules: `Headline: Fraunces (variable serif — organic, warm feel) at 28-32px. Body: Inter 14-15px. Labels: Inter 12px semibold. Import: @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap')`,
      elevationRules: `Cards: 12px radius, shadow 0 2px 8px rgba(22,163,74,0.06). Photo cards: 16px radius. No heavy shadows. Section dividers: 1px #E5E7EB or leaf-shaped SVG separator.`,
      componentRules: `Product cards: rounded photo top, name in serif below, "Organic" badge, price + "Add" pill button. Category pills: horizontal scroll, sage bg, leaf icon + text. Hero: large botanical photo with overlay text. CTA: green bg, white text, 12px radius, leaf icon. Nutrition facts: clean table with green row headers. Use {{HERO_IMAGE}} for garden/produce hero, {{CONTENT_IMAGE_1}}/{{CONTENT_IMAGE_2}} for product photos.`,
      dosAndDonts: `DO: Use serif font for product/section names (feels organic). DO: Include botanical/nature imagery. DO: Use green as the single dominant accent. DON'T: Use dark or cold surfaces. DON'T: Use tech/corporate styling. DON'T: Overcrowd — nature needs breathing room.`,
    },
  },
  {
    id: 'stitch-candy-kids',
    name: 'Candy Pop (Kids/Fun)',
    keywords: ['kids', 'children', 'game', 'fun', 'colorful', 'cartoon', 'playful', 'quiz', 'learn', 'toys'],
    mood: ['playful', 'light'],
    domains: ['education', 'social'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Exuberant, candy-colored design for kids' apps and gamified experiences. Uses the full rainbow strategically, with a bubbly rounded aesthetic, large tap targets, and celebratory animations. Every element says "fun" without being childish.`,
      colorRules: `Background: #FFF8F1 (warm cream). Cards: #FFFFFF.
Primary: bright blue #3B82F6. Secondary: coral #F97316. Accent pool: purple #8B5CF6, green #22C55E, pink #EC4899, yellow #EAB308. Use different accent per section for visual variety.
Text: #1E293B headings, #475569 body.
Star/reward: golden #EAB308. Progress: green #22C55E. Error: red #EF4444.`,
      typographyRules: `Font: Nunito (rounded, friendly). Headlines: 28-36px extrabold. Body: 16px regular. Button text: 16px bold. Score/numbers: 48px+ extrabold. Import: @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap')`,
      elevationRules: `Cards: 20px radius, shadow 0 4px 16px rgba(0,0,0,0.06). Buttons: 16px radius, shadow 0 4px 0 darken(color, 15%) for "pressable" 3D look. Stars: golden glow 0 0 12px rgba(234,179,8,0.3).`,
      componentRules: `Quiz cards: large question text, 4 colored option buttons (each a different pastel), selected = border 3px accent. Score display: star + large number + confetti. Progress bar: rainbow gradient fill, 12px height, 999px radius. Achievement badges: circular, colored, icon center. Avatar: 64px circle with colored ring. Bottom nav: 5 items, 56px height, center item elevated + accent colored.`,
      dosAndDonts: `DO: Use multiple colors purposefully — one per section or category. DO: Make tap targets extra large (48px+ min). DO: Use celebration/reward visuals (stars, confetti, badges). DON'T: Use a single monotone palette. DON'T: Use small text or dense layouts. DON'T: Make it look like an adult enterprise app.`,
    },
  },
  {
    id: 'stitch-pastel-lifestyle',
    name: 'Pastel Lifestyle (Soft Light)',
    keywords: ['lifestyle', 'blog', 'diary', 'journal', 'photography', 'aesthetic', 'fashion', 'beauty', 'magazine'],
    mood: ['pastel', 'elegant'],
    domains: ['media', 'social'],
    createdAt: '2025-01-01T00:00:00Z',
    source: 'curated',
    guide: {
      overview: `Soft, editorial lifestyle aesthetic. Muted pastel palette (blush, sage, powder blue) with careful whitespace and large photography. The design feels like a beautifully curated Instagram feed turned into an app — aspirational, tasteful, minimal.`,
      colorRules: `Background: #FAFAF9 (warm off-white). Cards: #FFFFFF.
Section tints: blush #FDF2F8, sage #F0FDF4, powder #EFF6FF, cream #FFFBEB.
Primary: dusty rose #E11D48 (muted, not neon). Secondary: sage #059669. Tertiary: powder blue #3B82F6.
Text: #1C1917 headings, #57534E body, #A8A29E captions.
Photo overlays: none — let photos speak without gradient overlays.`,
      typographyRules: `Headlines: Cormorant Garamond (elegant serif) 28-36px. Body: Inter 14-15px. Captions: Inter 12px italic. Import: @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500&display=swap')`,
      elevationRules: `Cards: 0 radius OR 16px radius (mix for visual rhythm). Shadows: 0 1px 4px rgba(0,0,0,0.04) only. Photo containers: no radius OR full-bleed. Floating elements: subtle border only, no shadow.`,
      componentRules: `Article cards: large photo (3:4 ratio), category tag (pill, pastel bg), title in serif, author + date in caption style. Story circles: 56px, soft pastel ring (blush/sage/powder). CTA: solid dusty rose, white text, 8px radius. Grid layout: Pinterest-style masonry for content. Tags: pastel bg + dark text, no border. Use {{HERO_IMAGE}} for lifestyle hero, {{CONTENT_IMAGE_1}}/{{CONTENT_IMAGE_2}} for editorial photos.`,
      dosAndDonts: `DO: Let photography be 70%+ of the visual weight. DO: Use serif fonts for editorial/headline content. DO: Alternate pastel section tints for visual rhythm. DON'T: Use bold/saturated colors — everything is muted and soft. DON'T: Add heavy UI elements that compete with photos. DON'T: Use dark mode — this is a light, airy aesthetic.`,
    },
  },
]
