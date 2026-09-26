/**
 * The small interactive pieces that used to be React state: the F.A.Q
 * accordion, the masthead-wall tabs, the film modal and the wire's
 * cursor-following thumbnail.
 */

/* ── 10 · F.A.Q accordion ─────────────────────────────────────── */
export function initFaq() {
  const items = [...document.querySelectorAll('[data-faq-item]')]
  if (!items.length) return

  const setOpen = (item, open) => {
    const btn = item.querySelector('[data-faq-toggle]')
    const panel = item.querySelector('[data-faq-panel]')
    item.classList.toggle('is-open', open)
    panel?.classList.toggle('is-open', open)
    btn?.setAttribute('aria-expanded', String(open))
  }

  items.forEach((item, i) => {
    const btn = item.querySelector('[data-faq-toggle]')
    btn?.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open')
      items.forEach((other) => setOpen(other, false))
      setOpen(item, !wasOpen)
    })
    setOpen(item, i === 0)
  })
}

/* ── 08 · masthead wall tabs ──────────────────────────────────── */
export function initTabs() {
  const buttons = [...document.querySelectorAll('[data-tab]')]
  if (!buttons.length) return

  const select = (name) => {
    buttons.forEach((b) => {
      const on = b.dataset.tab === name
      b.classList.toggle('is-active', on)
      b.setAttribute('aria-pressed', String(on))
    })
    document.querySelectorAll('[data-tab-panel]').forEach((p) => {
      p.hidden = p.dataset.tabPanel !== name
    })
  }

  buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.tab)))
  select(buttons[0].dataset.tab)
}

/* ── "Watch the film" modal ───────────────────────────────────── */
export function initFilmModal() {
  const modal = document.querySelector('[data-film-modal]')
  if (!modal) return

  const set = (open) => {
    modal.classList.toggle('is-open', open)
    modal.setAttribute('aria-hidden', String(!open))
  }

  document.querySelectorAll('[data-open-film]').forEach((b) =>
    b.addEventListener('click', () => set(true))
  )
  document.querySelectorAll('[data-close-film]').forEach((b) =>
    b.addEventListener('click', () => set(false))
  )
  modal.addEventListener('click', (e) => {
    if (e.target === modal) set(false)
  })
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false)
  })
  set(false)
}

/* ── 09 · the wire's floating thumbnail ───────────────────────── */
export function initWireThumb() {
  const list = document.querySelector('[data-wire-list]')
  const thumb = document.querySelector('[data-wire-thumb]')
  if (!list || !thumb) return

  const tint = thumb.querySelector('[data-wire-thumb-tint]')
  const kind = thumb.querySelector('[data-wire-thumb-kind]')

  list.addEventListener('mousemove', (e) => {
    thumb.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 70}px, 0)`
  })

  list.querySelectorAll('[data-wire-row]').forEach((row) => {
    row.addEventListener('mouseenter', () => {
      thumb.classList.add('is-on')
      row.classList.add('is-hot')
      if (tint) tint.style.background = row.dataset.tint || ''
      if (kind) kind.textContent = row.dataset.kind || ''
    })
    row.addEventListener('mouseleave', () => row.classList.remove('is-hot'))
  })

  list.addEventListener('mouseleave', () => thumb.classList.remove('is-on'))
}

/* ── ticker marquees ──────────────────────────────────────────── */
/**
 * The markup carries one copy of each track's items; this fills the strip and
 * clones the track so the loop is seamless. Without JS the ticker still reads
 * correctly, it just doesn't scroll.
 */
export function initTickers() {
  document.querySelectorAll('[data-marquee]').forEach((marquee) => {
    const track = marquee.querySelector('.marquee-track')
    if (!track) return

    const items = [...track.children]
    const need = Math.ceil(marquee.offsetWidth / Math.max(1, track.offsetWidth)) + 1
    for (let i = 0; i < need; i++) {
      items.forEach((item) => track.appendChild(item.cloneNode(true)))
    }
    marquee.appendChild(track.cloneNode(true))
  })
}
