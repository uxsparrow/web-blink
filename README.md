# Blink CMS — one-page scroll story

A single-page marketing site for Blink CMS, built to the structure and motion
system of unitedcarriers.com but told through a news story rather than a
shipping container: **Monitor → Gather → Create → Publish → Monetize → Analyze.**

```bash
npm install
npm run dev
```

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Bootstrap 5.3 via SCSS (`app/globals.scss`) |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll |
| 3D | Three.js via React Three Fiber (hero globe only) |
| Scenes | 2D canvas, drawn live — no baked image sequences |
| Map data | Natural Earth 110m via `world-atlas`, served from `public/data/` |

Total scroll length is roughly **35k px** at 1080p. Pins shorten by about half
below 900px; `prefers-reduced-motion` collapses every pin to a single key frame.

## Structure

```
app/
  layout.tsx        fonts + metadata
  page.tsx          the whole story, in order
  globals.scss      Bootstrap config + imports, then our layer
  styles/           _tokens _base _type _ui _layout (design system)
components/
  sections/         00–12, one file per section
  scenes/           canvas & WebGL scenes
  ui/               header, cursor, ticker, reveal, counter, marks, icons
lib/
  content.ts        ALL copy — single source of truth
  world.ts          land geometry → dot masks (preloader, globe, footer map)
  motion.ts         gsap/ScrollTrigger setup, easings, in-view gating
  fonts.ts          resolves next/font families for canvas text
```

## The scenes are code, not renders

Every 3D/illustrated element is drawn at runtime, so there are no frame
sequences to produce or ship:

| Brief asset | How it's built |
|---|---|
| Dotted globe, pings, arcs | `scenes/Globe.tsx` — Three.js points placed on **real land geometry**, red ping flares, bezier arcs back to Noida, headline tags projected to screen space |
| Bureau map + wire feed | `sections/Preloader.tsx` — Natural Earth land rasterised to a dot grid, centred on India |
| Typewriter → laptop → newspaper fold | `scenes/DeskScene.tsx` — one canvas rig; the body silhouette lerps between machines, the page types letter by letter, then folds in two stages |
| Press conveyor + front pages | `scenes/ConveyorScene.tsx` + `sections/Platform.tsx` |
| Top-down printing press | `scenes/PressScene.tsx` — paper web with smeared colour photos, violet-lit rollers |
| Flying newspaper pages | same file — ~320 page particles burst out of the press and flutter away to white |
| Paper plane | `scenes/PaperPlane.tsx` — folded from a front page, print still on the wing, flown along a bezier |
| Halftone wordmark | `scenes/HalftoneWordmark.tsx` — the type is rendered offscreen, sampled, and redrawn as dots sized by ink coverage |

## What still needs real assets

Marked in the UI so nothing reads as finished:

- **Brand film** — `ui/VideoModal.tsx`, the "Watch the film" frame
- **Newsroom footage** — `sections/FrontPage.tsx` thumbnail
- **Newsroom photo (B&W)** — `sections/Footer.tsx`
- **Publisher logos** — `sections/Mastheads.tsx` currently sets the names as
  mastheads; swap in SVGs if you have them
- **Case-study photos** — `sections/Letters.tsx` square slots

## What still needs real copy

`lib/content.ts` marks every gap with `PLACEHOLDER(...)`, which renders in red
mono on the page:

- **F.A.Q answers** — the brief supplied the eight questions and one answer
  ("Do you charge more as traffic grows?" → "No. Billing is by features.")
- **The Wire** — four headlines supplied, two slots empty, no article bodies
- **Footer email and phone**

## Content rules held

- No invented testimonials, people or quotes. Section 07 shows **results only**,
  exactly as supplied, with a standing note that no quotes are attributed.
- The preloader wire feed and the live-blog card are labelled sample text.
- Every headline is live HTML — nothing is baked into an image.

## Swapping the display face

Three lines in `app/layout.tsx` and one rule in `app/styles/_type.scss`. The current
pairing is Tomorrow Bold (display) / Space Grotesk (body, UI) / Space Mono
(labels, datelines) / Playfair Display + UnifrakturMaguntia (newspaper props).

## Styling conventions

Bootstrap is used for the grid, reboot and utilities only — **no Bootstrap JS**.
The accordion, tabs, menu and modal are React state, because Bootstrap's own JS
manipulates the DOM and fights React.

A few decisions worth knowing before editing:

- **`$spacers` is redefined to Tailwind's numeric scale** (`1 = .25rem` …
  `12 = 3rem`), so `gap-2`, `mb-5` and `py-10` mean what they look like.
  Bootstrap's stock 1–5 scale is *not* in effect.
- **Breakpoints are Tailwind's** (sm 640 / md 768 / lg 1024), not Bootstrap's.
- **`$position-values` is extended with the spacing scale**, so `bottom-7`
  works; stock Bootstrap only ships `0/50/100`.
- **The type scale is `.t-hero` … `.t-giant`**, deliberately not `.d-*`, which
  would read as Bootstrap's display utilities.
- **The utilities API is imported last**, so utility classes override the
  component classes in `app/styles/`. Anything added after it would outrank
  utilities — put new component CSS in the partials, not below that import.
- Layout that Bootstrap has no utility for (`top: 17%`, `width: 124vw`, the
  live-blog rail, the press feature positions) lives as named classes in
  `_layout.scss` rather than inline styles.

CSS ships at ~137 kB raw, ~21 kB gzipped. Unused utility groups (colour,
borders, type, effects) are stripped via `map-remove` in `globals.scss`.

## Notes

**Dev handles.** In development only, `window.__lenis` and `window.__ST`
(ScrollTrigger) are exposed, so you can drive the scroll story from the console:

```js
const d = document.querySelector('#desk')
__lenis.scrollTo(d.getBoundingClientRect().top + scrollY + 2400, { immediate: true })
__ST.getAll().filter(t => t.pin).map(t => t.progress)
```

Plain `window.scrollTo` will not stick — Lenis owns the scroll position.

**Don't run `next build` while `next dev` is running.** They share `.next`, and
the dev server starts throwing `__webpack_modules__[moduleId] is not a function`.
Stop the dev server first, or build into a separate distDir.

## Verification status

Built and type-checked clean. Verified visually: the preloader, the hero globe,
the press, the back-page map, the halftone wordmark, and the layout, type and
spacing of every section at 1440×900.

**Not yet verified:** the full scroll-scrubbed progression of the four pinned
scenes (typing → laptop morph → fold → landing; the conveyor's tilt to top-down;
the press burst), the paper plane, and hover states. The embedded browser used
to build this suspends `requestAnimationFrame` when its pane isn't painting, so
scrubbed frames could not be stepped through. Run `npm run dev` and scroll it on
a real screen — these are the first things to look at.
