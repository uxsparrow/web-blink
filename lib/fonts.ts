/**
 * next/font generates hashed family names, so canvas text can't hardcode them.
 * The font loader also exposes each family as a CSS variable on <html>, which is
 * a valid family list — read it once and reuse it in canvas font strings.
 */

const cache = new Map<string, string>()

function familyFromVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const hit = cache.get(name)
  if (hit) return hit
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const family = value ? `${value}, ${fallback}` : fallback
  cache.set(name, family)
  return family
}

export const displayFamily = () => familyFromVar('--font-tomorrow', 'Arial Narrow, sans-serif')
export const monoFamily = () => familyFromVar('--font-spacemono', 'monospace')
export const serifFamily = () => familyFromVar('--font-playfair', 'Georgia, serif')
export const sansFamily = () => familyFromVar('--font-grotesk', 'Helvetica Neue, Arial, sans-serif')
