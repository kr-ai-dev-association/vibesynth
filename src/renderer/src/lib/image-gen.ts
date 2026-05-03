/**
 * Image Generation Module — Provider-based architecture
 *
 * Supports pluggable image generation backends:
 * - NanoBanana (Gemini native image gen) — default
 * - Flux (future: self-hosted or API)
 * - Custom providers (implement ImageProvider interface)
 */

// ─── Provider Interface ─────────────────────────────────────────

export interface ImageGenRequest {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style?: 'photo' | 'illustration' | 'icon'
  width?: number
  height?: number
}

export interface ImageGenResult {
  base64: string
  mimeType: string
  dataUrl: string
}

export interface ImageProvider {
  name: string
  generate(request: ImageGenRequest): Promise<ImageGenResult | null>
}

// ─── NanoBanana Provider (Gemini) ───────────────────────────────

class NanoBananaProvider implements ImageProvider {
  name = 'NanoBanana (Gemini)'
  private ai: any = null

  private cachedKey: string = ''

  private async getClient() {
    // Prefer user-saved key (Settings → AI → API key); fall back to .env.
    const { getActiveGeminiKey } = await import('./gemini')
    let apiKey = getActiveGeminiKey()
    if (!apiKey && typeof window !== 'undefined' && window.electronAPI?.db?.getEffectiveGeminiKey) {
      apiKey = await window.electronAPI.db.getEffectiveGeminiKey()
    }
    if (!apiKey) apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
    if (!apiKey) throw new Error('Gemini API key not set — open Settings → AI → API key')
    // Re-create client when the key changes (user changed it in Settings).
    if (!this.ai || this.cachedKey !== apiKey) {
      const { GoogleGenAI } = await import('@google/genai')
      this.ai = new GoogleGenAI({ apiKey })
      this.cachedKey = apiKey
    }
    return this.ai
  }

  async generate(request: ImageGenRequest): Promise<ImageGenResult | null> {
    const ai = await this.getClient()

    const styleHint = request.style === 'illustration'
      ? 'Create a modern, clean digital illustration. '
      : request.style === 'icon'
      ? 'Create a simple, clean vector-style icon. '
      : 'Create a high-quality, professional photograph. '

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: `${styleHint}${request.prompt}. Make it look premium and suitable for a production mobile/web app UI.`,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: request.aspectRatio || '1:1',
        },
      },
    })

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType || 'image/png'
          const base64 = part.inlineData.data as string
          return {
            base64,
            mimeType,
            dataUrl: `data:${mimeType};base64,${base64}`,
          }
        }
      }
    }
    return null
  }
}

// ─── Flux Provider (placeholder for future self-hosted model) ───

// class FluxProvider implements ImageProvider {
//   name = 'Flux (Self-hosted)'
//   private endpoint: string
//
//   constructor(endpoint: string) {
//     this.endpoint = endpoint
//   }
//
//   async generate(request: ImageGenRequest): Promise<ImageGenResult | null> {
//     const response = await fetch(this.endpoint, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         prompt: request.prompt,
//         width: request.width || 1024,
//         height: request.height || 1024,
//         num_inference_steps: 4,
//       }),
//     })
//     const data = await response.json()
//     if (data.images?.[0]) {
//       return {
//         base64: data.images[0],
//         mimeType: 'image/png',
//         dataUrl: `data:image/png;base64,${data.images[0]}`,
//       }
//     }
//     return null
//   }
// }

// ─── Image Generation Manager ───────────────────────────────────

let activeProvider: ImageProvider = new NanoBananaProvider()

export function setImageProvider(provider: ImageProvider) {
  activeProvider = provider
}

export function getImageProvider(): ImageProvider {
  return activeProvider
}

export async function generateImage(
  prompt: string,
  options: Partial<ImageGenRequest> = {}
): Promise<ImageGenResult | null> {
  try {
    return await activeProvider.generate({ prompt, ...options })
  } catch (err) {
    console.error(`[VibeSynth] Image generation failed (${activeProvider.name}):`, err)
    return null
  }
}

// ─── Design Image Pipeline ─────────────────────────────────────

export interface DesignImageSpec {
  key: string
  prompt: string
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style: 'photo' | 'illustration' | 'icon'
}

/**
 * Analyze an app description and generate relevant images for it.
 * Returns a map of placeholder keys to data URLs.
 */
export async function generateDesignImages(
  appDescription: string,
  deviceType: 'app' | 'web' | 'tablet',
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const images = new Map<string, string>()
  const specs = deriveImageSpecs(appDescription, deviceType)
  const total = Math.min(specs.length, 3)

  const results = await Promise.allSettled(
    specs.slice(0, total).map(async (spec, i) => {
      const img = await generateImage(spec.prompt, {
        aspectRatio: spec.aspectRatio,
        style: spec.style,
      })
      if (img) {
        images.set(spec.key, img.dataUrl)
      }
      onProgress?.(i + 1, total)
    })
  )

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`[VibeSynth] Image ${specs[i].key} failed:`, r.reason)
    }
  })

  return images
}

// ─── Prompt Derivation ──────────────────────────────────────────

function deriveImageSpecs(description: string, _deviceType: 'app' | 'web' | 'tablet'): DesignImageSpec[] {
  const desc = description.toLowerCase()
  const specs: DesignImageSpec[] = []

  // Hero image
  specs.push({
    key: 'HERO_IMAGE',
    prompt: deriveHeroPrompt(desc),
    aspectRatio: '16:9',
    style: 'photo',
  })

  // Content images
  specs.push({
    key: 'CONTENT_IMAGE_1',
    prompt: deriveContentPrompt(desc, 1),
    aspectRatio: '4:3',
    style: 'photo',
  })

  specs.push({
    key: 'CONTENT_IMAGE_2',
    prompt: deriveContentPrompt(desc, 2),
    aspectRatio: '1:1',
    style: 'photo',
  })

  return specs
}

function deriveHeroPrompt(desc: string): string {
  const mappings: [string[], string][] = [
    [['plant', 'garden'], 'Beautiful indoor plants in modern pots arranged on a minimalist shelf, natural light, home interior photography'],
    [['fitness', 'workout', 'gym', 'exercise'], 'Athletic person working out in a modern gym with dramatic lighting, fitness photography'],
    [['food', 'recipe', 'cook', 'pizza', 'restaurant'], 'Beautifully plated gourmet dish on a rustic wooden table, overhead food photography with natural lighting'],
    [['travel', 'destination', 'romantic', 'vacation'], 'Stunning scenic travel destination with golden hour lighting, dreamy landscape photography'],
    [['ski', 'snow', 'alps', 'mountain'], 'Breathtaking mountain landscape with snow-capped peaks and clear blue sky, alpine photography'],
    [['cocktail', 'drink', 'bar', 'wine', 'beer'], 'Elegant craft cocktail with garnish on a marble bar counter, moody bar photography with bokeh lighting'],
    [['music', 'audio', 'podcast', 'playlist'], 'Professional studio headphones with colorful sound visualization, music production aesthetic'],
    [['shop', 'market', 'store', 'commerce', 'ceramic', 'pottery'], 'Stylish artisan products displayed in a modern boutique, commercial lifestyle photography'],
    [['learn', 'education', 'course', 'quiz', 'language'], 'Open notebook with colorful study materials on a clean desk, educational lifestyle photography'],
    [['dashboard', 'analytics', 'data', 'saas'], 'Modern workspace with sleek monitors showing data visualizations, tech office photography'],
    [['social', 'chat', 'message', 'community'], 'Group of diverse friends laughing together at a cafe, candid lifestyle photography'],
    [['magazine', 'read', 'article', 'news', 'blog'], 'Stack of beautifully designed magazines on a marble coffee table, editorial lifestyle photography'],
    [['health', 'medical', 'wellness', 'mindful'], 'Serene zen garden with smooth stones and flowing water, wellness photography'],
  ]

  for (const [keywords, prompt] of mappings) {
    if (keywords.some(kw => desc.includes(kw))) return prompt
  }
  return `Professional high-quality photo representing: ${desc.slice(0, 100)}. Modern, clean, premium aesthetic.`
}

function deriveContentPrompt(desc: string, index: number): string {
  const mappings: [string[], string, string][] = [
    [['plant', 'garden'],
      'Close-up of a healthy green monstera leaf with water droplets, botanical photography',
      'Small succulent plant in a ceramic pot, minimalist plant photography'],
    [['fitness', 'workout', 'gym'],
      'Colorful healthy meal prep bowls with fresh vegetables and grains, overhead food photography',
      'Person stretching outdoors in activewear at sunrise, fitness lifestyle'],
    [['food', 'recipe', 'cook', 'pizza'],
      'Fresh cooking ingredients arranged neatly on a cutting board, culinary photography',
      'Hands kneading dough on a floured surface, artisan cooking process'],
    [['travel', 'destination', 'romantic'],
      'Charming European street with colorful buildings and cafe tables, travel photography',
      'Couple walking along a beautiful beach at sunset, romantic travel'],
    [['cocktail', 'drink', 'bar'],
      'Close-up of bartender pouring a colorful cocktail, mixology photography',
      'Array of fresh cocktail ingredients: citrus fruits herbs and spirits, flat lay'],
    [['ski', 'snow', 'alps'],
      'Skier carving through fresh powder snow with mountains in background',
      'Cozy ski lodge interior with warm fireplace and mountain views through window'],
    [['shop', 'market', 'ceramic', 'pottery'],
      'Handmade ceramic vases in warm earthy tones displayed on wooden shelf',
      'Potter hands shaping clay on a wheel, artisan craftsmanship'],
    [['magazine', 'read', 'article'],
      'Person reading on a tablet in a modern minimalist living room',
      'Flat lay of coffee cup, reading glasses and open book on wooden table'],
  ]

  for (const [keywords, p1, p2] of mappings) {
    if (keywords.some(kw => desc.includes(kw))) return index === 1 ? p1 : p2
  }
  return `Professional photo related to: ${desc.slice(0, 80)}. Clean, modern, suitable for a mobile app.`
}
