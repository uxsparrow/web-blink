/**
 * The persistent UI: sticky header, breaking ticker, section label and the
 * custom cursor. All of it reacts to whichever `[data-nav]` block is under the
 * reading line, so the chrome inverts over the dark sections.
 */

/* ── which [data-nav] block sits under a given line ───────────── */
function navThemeAt(line) {
  let found = 'light'
  document.querySelectorAll('[data-nav]').forEach((z) => {
    const r = z.getBoundingClientRect()
    if (r.top <= line && r.bottom > line) found = z.dataset.nav === 'dark' ? 'dark' : 'light'
  })
  return found
}

/** One rAF-throttled scroll listener drives the whole chrome. */
function onScroll(fn) {
  let raf = 0
  const run = () => {
    fn()
    raf = 0
  }
  const handler = () => {
    if (!raf) raf = requestAnimationFrame(run)
  }
  fn()
  window.addEventListener('scroll', handler, { passive: true })
  window.addEventListener('resize', handler)
  return handler
}

/* ── header ───────────────────────────────────────────────────── */
export function initHeader() {
  const header = document.querySelector('[data-header]')
  const menu = document.querySelector('[data-menu]')
  const toggles = [...document.querySelectorAll('[data-menu-toggle]')]
  const demoPill = document.querySelector('[data-demo-pill]')
  const logo = header.querySelector('[data-header-logo]') || header.querySelector('img')
  const ticker = document.querySelector('[data-header-ticker]')
  if (!header) return

  const darkLogoSrc = './assets/images/blinkcms-logo-transparent.png'
  const lightLogoSrc = './assets/images/blinkcms-logo.png'
  const preloadImg = new Image()
  preloadImg.src = lightLogoSrc

  // Present from the first frame and at the very top of the page, not revealed
  // on scroll. It slides in behind the preloader, so it is already in place by
  // the time the intro lifts.
  header.classList.add('is-shown')

  let dark = null

  onScroll(() => {
    const nextDark = navThemeAt(34) === 'dark'
    if (nextDark !== dark) {
      dark = nextDark
      header.classList.toggle('is-dark', dark)
      if (demoPill) {
        demoPill.classList.toggle('pill-white', dark)
        demoPill.classList.toggle('pill-ink', !dark)
      }
      if (logo) {
        logo.src = dark ? darkLogoSrc : lightLogoSrc
      }
      // the breaking ticker rides along under the header on dark sections
      if (ticker) ticker.style.maxHeight = dark ? '34px' : '0px'
    }
  })

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
export function initSectionLabel() {
  const wrap = document.querySelector('[data-section-label]')
  if (!wrap) return
  const text = wrap.querySelector('[data-section-label-text]')
  let current = ''

  onScroll(() => {
    const line = window.innerHeight * 0.42
    let label = ''
    let dark = false
    document.querySelectorAll('[data-label]').forEach((z) => {
      const r = z.getBoundingClientRect()
      if (r.top <= line && r.bottom > line) {
        label = z.dataset.label || ''
        dark = z.closest('[data-nav]')?.dataset.nav === 'dark'
      }
    })
    if (!label || label === current) {
      wrap.classList.toggle('is-dark', dark)
      return
    }
    current = label
    wrap.classList.toggle('is-dark', dark)
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
      let next = 'default'
      if (hit?.closest('[data-cursor="media"]')) next = 'media'
      else if (hit?.closest('a, button, [data-cursor="hover"]')) next = 'hover'
      if (next !== mode) {
        mode = next
        wrap.dataset.mode = mode
      }

      const dark = hit?.closest('[data-nav]')?.dataset.nav === 'dark'
      wrap.classList.toggle('is-inverted', !!dark)
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
