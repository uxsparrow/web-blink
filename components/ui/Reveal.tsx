'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/motion'

export interface RevealLine {
  text: string
  className?: string
}

/**
 * Teleprompter reveal: each line sits in its own mask and rolls up from below,
 * line by line, as the block enters. Text stays live HTML.
 */
export default function Reveal({
  lines,
  as: Tag = 'h2',
  className = '',
  lineClassName = '',
  start = 'top 84%',
  stagger = 0.085,
  duration = 1.05,
  delay = 0,
}: {
  lines: (string | RevealLine)[]
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'p' | 'span'
  className?: string
  lineClassName?: string
  start?: string
  stagger?: number
  duration?: number
  delay?: number
}) {
  const root = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const inners = el.querySelectorAll('.line-inner')
    if (!inners.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(inners, { yPercent: 0, opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inners,
        { yPercent: 112, opacity: 0.25 },
        {
          yPercent: 0,
          opacity: 1,
          duration,
          delay,
          stagger,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start, once: true },
        }
      )
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [start, stagger, duration, delay])

  // one concrete signature, so the intrinsic-element union stays out of inference
  const Comp = Tag as unknown as React.FC<{
    className?: string
    ref?: React.Ref<HTMLElement>
    children?: React.ReactNode
  }>

  return (
    <Comp ref={root} className={className}>
      {lines.map((l, i) => {
        const line = typeof l === 'string' ? { text: l } : l
        return (
          <span key={i} className={`line-mask ${lineClassName}`}>
            <span className={`line-inner ${line.className ?? ''}`}>{line.text}</span>
          </span>
        )
      })}
    </Comp>
  )
}
