/**
 * 06 · HEAD TO HEAD — the split-screen divider.
 *
 * Scroll moves it from the left edge to the centre as the section arrives, and
 * from then on the reader can drag it. Both write the same `--split` custom
 * property, and a drag stops the scroll from writing it again — otherwise the
 * two would fight every frame and the handle would feel broken.
 */

import { onScrub, clamp, hasGsap, reducedMotion } from '../lib/motion.js'

export function mountVersus(root) {
  const handle = root.querySelector('[data-vs-handle]')
  if (!handle) return null

  let dragging = false
  let taken = false

  const set = (pct) => root.style.setProperty('--split', clamp(pct, 4, 96) + '%')

  /* the arrival: left edge → centre, scrubbed so it reverses on the way up */
  if (hasGsap && !reducedMotion()) {
    set(6)
    onScrub(
      root.closest('.ed') || root,
      (p) => {
        if (taken) return
        set(6 + 44 * clamp(p * 1.4))
      },
      { start: 'top 85%', end: 'center 60%', scrub: 0.5 }
    )
  } else {
    set(50)
  }

  /* the drag */
  const at = (clientX) => {
    const r = root.getBoundingClientRect()
    return ((clientX - r.left) / r.width) * 100
  }

  const down = (e) => {
    dragging = true
    taken = true
    handle.setPointerCapture?.(e.pointerId)
    set(at(e.clientX))
  }
  const move = (e) => {
    if (!dragging) return
    set(at(e.clientX))
  }
  const up = () => {
    dragging = false
  }

  handle.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerup', up)

  // dragging anywhere on the panel, not only on the 34px grip
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return
    taken = true
    dragging = true
    set(at(e.clientX))
  })

  // and for anyone not using a pointer
  const grip = handle.querySelector('.vs__grip')
  if (grip) {
    grip.tabIndex = 0
    grip.setAttribute('role', 'slider')
    grip.setAttribute('aria-label', 'Compare the two stacks')
    grip.setAttribute('aria-valuemin', '0')
    grip.setAttribute('aria-valuemax', '100')
    grip.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 6 : e.key === 'ArrowLeft' ? -6 : 0
      if (!step) return
      e.preventDefault()
      taken = true
      const now = parseFloat(getComputedStyle(root).getPropertyValue('--split')) || 50
      set(now + step)
      grip.setAttribute('aria-valuenow', String(Math.round(clamp(now + step, 4, 96))))
    })
  }

  return null
}

