/**
 * Popular Google Fonts list for Typography dropdown.
 * Curated from the most popular web fonts on Google Fonts.
 */

export const GOOGLE_FONTS = [
  // Sans-serif
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito',
  'Raleway', 'DM Sans', 'Space Grotesk', 'Outfit', 'Plus Jakarta Sans',
  'Manrope', 'Figtree', 'Geist', 'Work Sans', 'Barlow', 'Rubik', 'Karla',
  'Mulish', 'Quicksand', 'Source Sans 3', 'Cabin', 'Lexend', 'Albert Sans',
  'Urbanist', 'Sora', 'Red Hat Display', 'Overpass', 'Noto Sans',
  // Serif
  'Playfair Display', 'Merriweather', 'Lora', 'Libre Baskerville', 'PT Serif',
  'Cormorant Garamond', 'Crimson Text', 'Fraunces', 'Bitter', 'Noto Serif',
  'Source Serif 4', 'DM Serif Display', 'Spectral', 'Vollkorn', 'Libre Caslon Text',
  // Monospace
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'Space Mono',
  'Roboto Mono', 'Ubuntu Mono', 'Inconsolata',
  // Display
  'Bebas Neue', 'Oswald', 'Fjalla One', 'Anton', 'Archivo Black',
  'Righteous', 'Lilita One', 'Permanent Marker',
] as const

export type GoogleFont = typeof GOOGLE_FONTS[number]

/**
 * Generate Google Fonts @import URL for given font families.
 */
export function googleFontsImportUrl(families: string[]): string {
  const params = families
    .map(f => `family=${f.replace(/\s/g, '+')}:wght@300;400;500;600;700;800`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}
