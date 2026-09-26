/**
 * Canvas text can't use CSS variables, so read the family names off :root
 * once and reuse them in canvas font strings.
 */

const cache = new Map()

function familyFromVar(name, fallback) {
  const hit = cache.get(name)
  if (hit) return hit
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const family = value ? `${value}, ${fallback}` : fallback
  cache.set(name, family)
  return family
}

export const displayFamily = () => familyFromVar('--font-tomorrow', 'Arial Narrow, sans-serif')
export const monoFamily = () => familyFromVar('--font-spacemono', 'monospace')
