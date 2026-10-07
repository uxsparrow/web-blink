/**
 * The persistent UI: the header, the overlay menu and the fixed section label.
 *
 * The custom cursor is gone. It was a ring that followed the pointer with
 * `cursor: none` on everything underneath it, which meant the page had no
 * system cursor at all — no hand over a link, no caret in the newsletter
 * field, and nothing at all if the script failed. The browser's own cursor
 * says more, in the places it matters, than a ring ever did.
 */

import { onScroll } from '../lib/motion.js'

/* ── header ───────────────────────────────────────────────────── */
export function initHeader() {
  const header = document.querySelector('[data-header]')
  if (!header) return

  const menu = document.querySelector('[data-menu]')
  const toggles = [...document.querySelectorAll('[data-menu-toggle]')]

  // Present from the first frame and at the very top of the page. The bar has
  // its glass background at every scroll position; this only deepens it once
  // there is something scrolling underneath.
  header.classList.add('is-shown')
  onScroll(() => header.classList.toggle('is-scrolled', window.scrollY > 24))

  let open = false
  const setMenu = (next) => {
    open = next
    menu?.classList.toggle('is-open', open)
    toggles.forEach((t) => {
      t.setAttribute('aria-expanded', String(open))
      const label = t.querySelector('[data-menu-label]') || t
      label.textContent = open ? 'CLOSE' : 'MENU'
    })
    menu?.setAttribute('aria-hidden', String(!open))
  }

  toggles.forEach((t) => t.addEventListener('click', () => setMenu(!open)))
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)))
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setMenu(false)
  })
  setMenu(false)
}

/* ── section label ────────────────────────────────────────────── */
/** Reads whichever `[data-label]` block is crossing the reading line. */
export function initSectionLabel() {
  const wrap = document.querySelector('[data-section-label]')
  if (!wrap) return
  const text = wrap.querySelector('[data-section-label-text]')
  let current = ''

  onScroll(() => {
    const line = window.innerHeight * 0.42
    let label = ''
    document.querySelectorAll('[data-label]').forEach((z) => {
      const r = z.getBoundingClientRect()
      if (r.top <= line && r.bottom > line) label = z.dataset.label || ''
    })
    if (!label || label === current) return
    current = label
    if (text) {
      text.textContent = label
      // restart the entry animation
      text.style.animation = 'none'
      void text.offsetWidth
      text.style.animation = ''
    }
  })
}
