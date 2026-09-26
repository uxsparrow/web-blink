import type { Metadata, Viewport } from 'next'
import {
  Tomorrow,
  Space_Grotesk,
  Space_Mono,
  Playfair_Display,
  UnifrakturMaguntia,
} from 'next/font/google'
import './globals.scss'

/* Display: wide squared geometric grotesk — the masthead voice. */
const tomorrow = Tomorrow({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tomorrow',
  display: 'swap',
})

/* Body / UI. */
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})

/* Datelines, labels, ticker. */
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-spacemono',
  display: 'swap',
})

/* Newspaper props + footer tagline only — never UI. */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

const fraktur = UnifrakturMaguntia({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-fraktur',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Blink CMS — Every stage of the story',
  description:
    'Monitor, gather, create, publish, monetize and analyze, all in one newsroom platform. The extended tech team behind 150+ newsrooms.',
  metadataBase: new URL('https://blinkcms.com'),
  openGraph: {
    title: 'Blink CMS — Every stage of the story',
    description:
      'Monitor, gather, create, publish, monetize and analyze, all in one newsroom platform.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${tomorrow.variable} ${grotesk.variable} ${spaceMono.variable} ${playfair.variable} ${fraktur.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
