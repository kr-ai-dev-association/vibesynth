/**
 * PRD Generator Module
 *
 * Automatically generates a PRD-style prompt with multiple screen definitions
 * from a simple user prompt. Detects the app domain and generates appropriate
 * page structures similar to the LifeFlow example PRDs.
 *
 * Usage:
 *   const enhanced = await generatePrdPrompt("A fitness tracking app")
 *   // Returns: "A fitness tracking app... screens: Dashboard, Workout Plans, Progress"
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string

/**
 * Enhance a simple prompt into a multi-screen PRD-style prompt.
 * Returns the original prompt with `screens:` syntax appended.
 */
export async function generatePrdPrompt(
  userPrompt: string,
  deviceType: 'app' | 'web' | 'tablet',
): Promise<{ enhancedPrompt: string; screenNames: string[]; prdSummary: string }> {
  // If already has screens: syntax, return as-is
  if (/screens?\s*:/i.test(userPrompt)) {
    const match = userPrompt.match(/screens?\s*:\s*(.+)/i)
    const names = match ? match[1].split(/[,;]/).map(s => s.trim()).filter(Boolean) : []
    return { enhancedPrompt: userPrompt, screenNames: names, prdSummary: '' }
  }

  // Quick local analysis — detect domain and suggest screens without API
  const screens = detectScreensFromPrompt(userPrompt, deviceType)

  if (screens.length >= 3) {
    // Local detection worked well
    const enhancedPrompt = `${userPrompt}. screens: ${screens.join(', ')}`
    return { enhancedPrompt, screenNames: screens, prdSummary: '' }
  }

  // Fallback: use AI to generate screen names
  if (!API_KEY) {
    const fallback = getDefaultScreens(deviceType)
    return {
      enhancedPrompt: `${userPrompt}. screens: ${fallback.join(', ')}`,
      screenNames: fallback,
      prdSummary: '',
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const result = await model.generateContent([
      `Given this app description, suggest 3-5 screen/page names for a ${deviceType} app.
Return ONLY a comma-separated list of screen names. No explanation.
Examples: "Dashboard, User Profile, Settings" or "Home, Search, Product Detail, Cart, Checkout"

App description: "${userPrompt}"`,
    ])

    const text = result.response.text().trim()
    const names = text.split(/[,;]/).map(s => s.trim().replace(/^\d+\.\s*/, '')).filter(s => s && s.length < 40)

    if (names.length >= 2) {
      const enhancedPrompt = `${userPrompt}. screens: ${names.join(', ')}`
      return { enhancedPrompt, screenNames: names, prdSummary: '' }
    }
  } catch {
    // AI failed, use local fallback
  }

  const fallback = getDefaultScreens(deviceType)
  return {
    enhancedPrompt: `${userPrompt}. screens: ${fallback.join(', ')}`,
    screenNames: fallback,
    prdSummary: '',
  }
}

/**
 * Detect appropriate screen names from the prompt keywords.
 */
function detectScreensFromPrompt(prompt: string, deviceType: 'app' | 'web' | 'tablet'): string[] {
  const p = prompt.toLowerCase()

  // Domain-specific screen mappings
  const mappings: [string[], string[]][] = [
    // E-commerce
    [['shop', 'store', 'ecommerce', 'marketplace', 'cart', 'product'],
      ['Home', 'Product Catalog', 'Product Detail', 'Shopping Cart', 'Checkout']],
    // Dashboard / Admin
    [['dashboard', 'admin', 'analytics', 'management', 'crm'],
      ['Overview Dashboard', 'Data Table', 'Detail View', 'Settings']],
    // Social
    [['social', 'feed', 'community', 'chat', 'message'],
      ['Feed', 'Profile', 'Messages', 'Notifications', 'Settings']],
    // Fitness / Health
    [['fitness', 'workout', 'health', 'exercise', 'tracking'],
      ['Dashboard', 'Workout Plans', 'Progress Charts', 'Profile']],
    // Food / Recipe
    [['food', 'recipe', 'restaurant', 'delivery', 'menu'],
      ['Home', 'Menu', 'Order Detail', 'Cart', 'Order Tracking']],
    // Travel
    [['travel', 'booking', 'hotel', 'flight', 'destination'],
      ['Explore', 'Destination Detail', 'Booking', 'My Trips']],
    // Education / Learning
    [['learn', 'education', 'course', 'quiz', 'study'],
      ['Home', 'Course Detail', 'Lesson', 'Quiz', 'Progress']],
    // Finance
    [['finance', 'bank', 'money', 'budget', 'payment', 'wallet'],
      ['Overview', 'Transactions', 'Transfer', 'Cards', 'Settings']],
    // Music / Media
    [['music', 'podcast', 'audio', 'playlist', 'stream'],
      ['Home', 'Now Playing', 'Library', 'Search']],
    // Landing / Marketing
    [['landing', 'homepage', 'marketing', 'saas', 'startup'],
      ['Hero & Features', 'Pricing', 'About & Team']],
    // Wellness / Meditation
    [['wellness', 'meditation', 'mindful', 'yoga', 'selfcare'],
      ['Today', 'Meditation Timer', 'Mood Tracker', 'Journal']],
  ]

  for (const [keywords, screens] of mappings) {
    if (keywords.some(kw => p.includes(kw))) {
      return screens
    }
  }

  return [] // No match — let AI decide
}

function getDefaultScreens(deviceType: 'app' | 'web' | 'tablet'): string[] {
  if (deviceType === 'web') return ['Home', 'Features', 'Pricing']
  if (deviceType === 'tablet') return ['Dashboard', 'Detail View', 'Settings']
  return ['Home', 'Detail', 'Profile']
}
