'use client'

import { useCallback, useEffect, useState } from 'react'
import SmoothScroll from '@/components/ui/SmoothScroll'
import Cursor from '@/components/ui/Cursor'
import Header from '@/components/ui/Header'
import SectionLabel from '@/components/ui/SectionLabel'
import Preloader from '@/components/sections/Preloader'
import Hero from '@/components/sections/Hero'
import FrontPage from '@/components/sections/FrontPage'
import Desk from '@/components/sections/Desk'
import Platform from '@/components/sections/Platform'
import Live from '@/components/sections/Live'
import Press from '@/components/sections/Press'
import Letters from '@/components/sections/Letters'
import Mastheads from '@/components/sections/Mastheads'
import Wire from '@/components/sections/Wire'
import Faq from '@/components/sections/Faq'
import OnAir from '@/components/sections/OnAir'
import Footer from '@/components/sections/Footer'
import { ScrollTrigger } from '@/lib/motion'

export default function Page() {
  const [ready, setReady] = useState(false)

  // hold the page still while the bureaus load
  useEffect(() => {
    document.documentElement.style.overflow = ready ? '' : 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [ready])

  const onLoaderDone = useCallback(() => {
    setReady(true)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  // failsafe: nothing about the intro may leave the page locked
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 7000)
    return () => window.clearTimeout(id)
  }, [])

  // pinned scenes change the document height as they initialise
  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => window.clearTimeout(id)
  }, [ready])

  return (
    <>
      <SmoothScroll />
      <Cursor />
      <Header />
      <SectionLabel />

      {!ready && <Preloader onDone={onLoaderDone} />}

      <main id="top">
        <Hero ready={ready} />
        <FrontPage />
        <Desk />
        <Platform />
        <Live />
        <Press />
        <Letters />
        <Mastheads />
        <Wire />
        <Faq />
        <OnAir />
      </main>

      <Footer />
    </>
  )
}
