'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/motion'

/** Giant stat that counts up once, when it scrolls in. */
export default function Counter({
  value,
  suffix = '',
  className = '',
  duration = 1.9,
}: {
  value: number
  suffix?: string
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = String(value) + suffix
      return
    }

    const obj = { n: 0 }
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        n: value,
        duration,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = Math.round(obj.n).toLocaleString('en-IN') + suffix
        },
      })
    }, el)
    return () => ctx.revert()
  }, [value, suffix, duration])

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  )
}
