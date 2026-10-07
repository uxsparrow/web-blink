/**
 * The persistent UI: the header, the overlay menu, the fixed section label and
 * the cursor ring.
 *
 * All of it used to invert as `[data-nav]` blocks passed under a reading line —
 * the bar swapped between a white and a dark skin, the logo was swapped for a
 * second file, the demo pill swapped classes, the label and the cursor flipped
 * colour. The page is one background now, so there is nothing to invert
 * against and none of that machinery is left. What remains is the menu, the
 * label's text, and the ring following the pointer.
 */

/** One rAF-throttled scroll listener, run once so the first frame is right. */
import { onScroll } from '../lib/motion.js'

/* ── header ───────────────────────────────────────────────────── */
export function initHeader() {
  const header = document.querySelector('[data-header]')
  if (!header) return

  const menu = document.querySelector('[data-menu]')
  const toggles = [...document.querySelectorAll('[data-menu-toggle]')]

  // Present from the first frame and at the very top of the page, not revealed
  // on scroll. It slides in behind the preloader, so it is already in place by
  // the time the intro lifts.
  header.classList.add('is-shown')

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

/* ── custom cursor ────────────────────────────────────────────── */
export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return
  const wrap = document.querySelector('[data-cursor-root]')
  if (!wrap) return

  // The native cursor is only hidden once this is actually up, so a failure
  // here leaves a normal pointer rather than no pointer at all.
  document.documentElement.setAttribute('data-custom-cursor', '')
  wrap.hidden = false

  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const pos = { ...target }
  let mode = 'default'

  window.addEventListener(
    'pointermove',
    (e) => {
      target.x = e.clientX
      target.y = e.clientY

      const hit = document.elementFromPoint(e.clientX, e.clientY)
      const next = hit?.closest('a, button, [data-cursor="hover"]') ? 'hover' : 'default'
      if (next !== mode) {
        mode = next
        wrap.dataset.mode = mode
      }
    },
    { passive: true }
  )

  const loop = () => {
    pos.x += (target.x - pos.x) * 0.22
    pos.y += (target.y - pos.y) * 0.22
    wrap.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}
