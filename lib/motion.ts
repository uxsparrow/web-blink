'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }

/** prefers-reduced-motion — pins collapse to single key frames + fades. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Mobile shortens pins by ~50% and drops scene detail. */
export function useIsMobile(breakpoint = 900): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setMobile(mq.matches)
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [breakpoint])
  return mobile
}

/** Runs a GSAP setup inside a context that auto-reverts. */
export function useGsap(
  setup: (ctx: { self: HTMLElement }) => void,
  deps: unknown[] = []
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => setup({ self: el }), el)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/**
 * Canvas scenes: gives a ref plus a device-pixel-ratio-aware sizing hook and a
 * `progress` object that ScrollTrigger writes to and rAF reads from.
 */
export function useCanvasScene(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) => void
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const progress = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const start = performance.now()
    const loop = () => {
      ctx.clearRect(0, 0, w, h)
      draw(ctx, w, h, progress.current, (performance.now() - start) / 1000)
      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { canvasRef, progress }
}

/* ── easing / maths helpers used across scenes ─────────────────── */

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Remap p from [a,b] onto [0,1], clamped. */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
export const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Is an element near the viewport? Scenes use this to stop rendering when they
 * scroll away — three long-running rAF loops on one page is a real cost.
 */
export function useInView(margin = '25%'): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: `${margin} 0px ${margin} 0px` }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin])
  return [ref, inView]
}
