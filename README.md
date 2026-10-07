# Blink CMS — one continuous world

A single-page marketing site for Blink CMS. **Every section after the hero is
exactly one browser window tall, fills at least three-quarters of it with its
own signature graphic, and is built from one shared visual language.**

That sentence is the whole design, and it is the second attempt at it. The
first pass fixed consistency and overshot: one background, one card, one
motion — and small content floating in large dark screens. This pass keeps the
consistency and puts something in the screens. Twelve sections, twelve
graphics, one world.

**Plain HTML, CSS and JavaScript. No framework, no build step.** Drop this
folder on any static host and it works.

> Picking this up fresh? Read [HANDOFF.md](HANDOFF.md) §0 — it covers both
> redesigns and what is still open.

## Running it

**There is no build step.** The folder *is* the site — put it behind any web
server and it works. nginx, Apache, cPanel, S3, Netlify, GitHub Pages and any
CMS that serves static files will take it as-is.

It does have to be *served over http*. The page uses ES modules and `fetch`,
and both are blocked on the `file://` origin, so **double-clicking `index.html`
will not give you the real page.** Serving the folder is all it needs:

```bash
npx serve .
```

Then open <http://localhost:8080> (or whichever port it prints).

## What's in the folder

```
index.html            the whole page — hero, twelve sections, footer
assets/media.js       EVERY image, video and logo path, in one place
data/
  india-boundary.json the official Survey of India boundary, for 01
  countries-110m.json Natural Earth land, for the globe
css/
  styles.css          all styles — edit directly, nothing to compile
  fonts.css           @font-face rules for the self-hosted fonts
js/
  main.js             entry point
  lib/motion.js       gsap/ScrollTrigger, onScrub, onInView, easings
  lib/content.js      the copy the scripts need as data
  lib/compare.js      06's comparison rows
  lib/world.js        Natural Earth land geometry, for the globe
  ui/edition.js       page-wide: reveal, ambient, parallax, media, wordmark
  ui/panels.js        the five swapping panels (02, 06, 07, 08, 11)
  ui/chrome.js        header, overlay menu, section label
  scenes/dots.js      the canvas toolkit + the two ambient dot fields
  scenes/network.js   01 · the dot-matrix map of India
  scenes/bento.js     03 · tile tilt and the micro-UI gate
  scenes/flow.js      04 · the node diagram, and 09's rate-card lines
  scenes/live.js      05 · counter, area chart, server rack
  scenes/globe.js     the hero globe (Three.js, lazy), used twice
tools/
  build-india-map.js  one-off generator for india-boundary.json — NOT a build step
vendor/               GSAP, ScrollTrigger, topojson-client, Three.js
fonts/                Tomorrow, Space Grotesk, Space Mono
```

## The four rules

Read the `BLINK · EDITION` banner in `css/styles.css` before changing anything
below the hero. In short:

**1 · One screen.** `.ed` is `height: 100svh` and nothing is ever taller than
the window. Three height breakpoints take content away as the window shortens
(800px drops support lines, 680px thins grids and lists, 520px gives up and
lets sections grow, because clipping is worse than scrolling on a phone in
landscape). **Nothing fakes a fit with `overflow: hidden`.**

**2 · Every section is full.** This is the rule the previous build failed, and
the fix is structural rather than a table of guessed heights:

```css
.ed__shell { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0 }
.ed__head  { flex: none }
.ed__gfx   { flex: 1 1 auto; min-height: 0 }
```

The graphic takes exactly the room the text leaves, at every window size. One
declaration satisfies "fits" and "fills" at once. **Do not give a graphic a
fixed height** — give its contents `height: 100%` and let the flex box decide.
Measured: the content block is 86% of every section at 1440×900.

**3 · One visual DNA.** Dot-matrix, purple light, lavender hairlines, glass
panels, mono meta, three parallax depths — and red *only* for live, alert and
breaking states. Every section graphic uses at least three. A graphic that
does not will look like it came off another website, which is the thing both
redesigns exist to stop.

**4 · No hard edges.** No section sets a background. The base and the 64px grid
are one fixed layer behind the whole page; the hero's two glows live inside the
hero; every section graphic dissolves into the page top and bottom with
`.ed__fade`. Scrolling past a section boundary should show nothing happening.

### Traps this hit, so you do not have to

1. **`ch` resolves against the element's own font.** `max-width: 24ch` on a
   wrapper set in body copy is ~235px while the headline inside it runs at
   62px. Size display text in its own units or in px.
2. **`svh` alone is not enough.** A 360×740 phone has height and no width.
   Every display-sized clamp needs `min(Xsvh, Yvw)` — and in layout A the
   headline needs a `vw` cap too, because it lives in a 5-of-12 column.
3. **`100vw` includes the scrollbar.** The graphics that bleed to the window
   edge are sized off `--vpw`, written from `documentElement.clientWidth`.
   With `100vw` the bleed overshot by exactly the scrollbar width.
4. **A definite height beats `max-width` when an `aspect-ratio` is in play.**
   `height: 100%` + `aspect-ratio` + `max-width: 100%` still overflows a short
   wide column. Make the width the definite side and clamp with `max-height`.
5. **An entry reveal on a percentage threshold can be skipped.** A section is a
   whole window tall; a fast scroll or an in-page link can jump clean over 10%
   of it, and a section that never gets `.is-in` stays invisible forever. Use
   `threshold: 0` with a negative bottom `rootMargin`.

## Motion

Scroll-linked or ambient, **never pinned**. ScrollTrigger scrubs; it does not
pin, and nothing takes the scroll away from the reader. `onScrub()` in
`lib/motion.js` is the one entry point — and with reduced motion or no GSAP it
calls `draw(1)` once, so a graphic that would have assembled arrives already
assembled rather than never arriving.

- **The one entry reveal**: fade in, up 24px, 600ms, staggered 80ms by `--i`.
  It covers everything — the hero copy, every section's label, headline and
  support line, and the items *inside* each module. Rather than tagging
  hundreds of elements by hand, `STAGGER` in `ui/edition.js` lists the
  containers whose children each take their own place in the sequence
  (`.stats`, `.bento`, `.rates`, `.wire`, `.qlist`, the footer columns…);
  `expandStagger()` assigns them at boot, counting on from the container's own
  `--i`, and removes the container's — otherwise a child would move 24px
  inside a parent moving 24px.

  The hero is the exception, and deliberately so: its copy rides `.is-loaded`
  on `<html>`, not the shared `.is-in`, because `.is-in` belongs to an
  IntersectionObserver and putting hero text back under an observer is exactly
  what had the title coming back cut.

  **Every revealed element starts at `opacity: 0`, so a reveal that never
  fires is a blank page.** `initReveals()` therefore carries a safety net: a
  document that loads *hidden* — a background tab, a minimised window — gets
  no IntersectionObserver callbacks at all in Chrome, so the reveal also runs
  on `visibilitychange` and once on a 2.5s timer. This is not theoretical; it
  was found by measuring the page in a hidden preview pane and finding nothing
  revealed and a plain observer reporting nothing.
- **Parallax**: back 0.3, mid 0.7, chips 1.15, capped at ±80px. Content itself
  is never parallaxed.
- **The fixed back layer in 05.** Its picture is held still while the section
  scrolls over it. It is a **scroll-driven CSS animation** (`view-timeline-name`
  on `.layer-back--fixed`, `hold-still` on the slot), because that is evaluated
  by the compositor on the same frame as the scroll. Driving it from a scroll
  event instead — which is what `initFixedBg()` does, and all it is now — hands
  the script a scroll the browser has already painted, so the transform lands a
  frame late and the picture shudders. The script runs only where scroll-driven
  animations do not.
  `position: fixed` is not an option: it escapes the layer's `overflow: hidden`
  and shows over the neighbouring sections, and any `transform`/`filter`/
  `clip-path` on an ancestor cancels it anyway. `background-attachment: fixed`
  is ignored on iOS.
  Two cases need stating. Under `prefers-reduced-motion` the animation stays
  (a picture holding still is the calmer option) but its duration has to be
  re-asserted as `auto`, because on a progress timeline a duration is a slice
  of the timeline, not a speed, and the blanket 0.001ms reset would park the
  picture a window low. Below 520px of height the sections grow past one
  window, the fixed distance stops matching the section's travel, and the slot
  goes back to simply covering its section.
- **Ambient loops only in view.** Every canvas loop and every CSS micro-UI is
  gated on an IntersectionObserver. Twelve sections of animation running at
  once is how a phone loses 60fps.
- **`prefers-reduced-motion`**: no parallax, no loops, videos never load, the
  reveal becomes an opacity fade and every scrubbed graphic draws its finished
  state.

## Assets — local placeholders, all from one file

**Every image and video on the page comes from `assets/media.js`.** Nothing in
the markup carries a path: the HTML says `data-img="wire_1"` and the script
resolves it. To ship real assets, change `src` on the entry — that is the
whole change, in one file.

```js
images.wire_1     = { src: 'assets/img/wire-1.jpg', w: 1400, h: 900, … }
videos.live_video = { src: 'assets/video/live-newsroom.mp4', poster: { … } }
logos[0]          = { name: 'Daily Thanthi', src: 'assets/logos/daily-thanthi.svg' }
```

| Key | File | Used by |
|---|---|---|
| `beats_thanthi` · `-madhyamam` · `-bhaskar` · `-hansindia` · `-livelaw` · `-federal` | `assets/img/beats-*.jpg` | 07, one per segment |
| `letters_1` · `letters_2` | `assets/img/letters-*.jpg` | 08's card and the deck behind it |
| `wire_1` · `wire_2` · `wire_3` | `assets/img/wire-*.jpg` | 10's three post cards |
| `live_video` · `cta_video` posters | `assets/img/poster-*.jpg` | the 05 and 12 back layers |
| `logos[]` | — | 01's marquees and 12's orbit; set as type until SVGs exist |

**The page makes no third-party request for media.** All thirteen pictures are
in `assets/img/`. The only external call left on the whole site is the YouTube
embed behind "Watch video", and that is not made until someone presses it.

### ⚠ They are still placeholders

Each was fetched once from Lorem Picsum, which serves photographs from
Unsplash, and saved locally so the layout could be reviewed without calling
out to anything. `seed` and `credit` in `media.js` record exactly which
picture each one is. They are generic stock photographs of nothing in
particular — **not** Blink CMS screenshots, **not** client newsrooms, **not**
cleared brand assets. Replace all of them before launch.

**08 is never a face.** Its quotes carry real publisher names and placeholder
people, so a stock photograph of a plausible-looking person beside one reads
as that person. Those two are abstract frames on purpose, and when real
portraits arrive the names have to be real too.

**There are no videos.** There was nothing to save: `src` is empty on both and
the page never requests one, so the poster carries the slot with a slow zoom.
Drop a file in `assets/video/`, point `src` at it, and it starts playing in
view with no other change. Supply MP4 + WebM, 1920×1080, 8–12s seamless loop,
≤3MB.

A missing file is never an error — an image that 404s hides itself and the
drawn stand-in behind it shows through. The same purple duotone —
`grayscale(1) contrast(1.1) brightness(0.8)` plus `#6118EA` at 60% in `color`
blend mode — is applied to every picture, so a client screenshot and a
stand-in sit in the same world.

The thirteen placeholders are 2.0 MB in total, unoptimised, straight from the
source. **Do not measure Lighthouse against them** — see "Verification status".

## Editing content

All copy is in `index.html` so the page reads with JavaScript disabled. The
only copy in JavaScript is `js/lib/content.js`: bureau coordinates, the globe's
ping tags, and the two letters in 08 (a carousel has nowhere in the markup to
put the items it is not showing).

**Text rules**: headline ≤6 words · support ≤12 words · card title 1–3 words
plus a ≤6-word descriptor · answers and quotes ≤25 words · about 40 visible
words per section, numbers and logos excluded. No paragraphs.

## Tokens

- **Base** `#06040E` · **primary** `#6118EA` · **primary-light** `#9A6CF1` ·
  **lavender** `#B9A6FF` · **text** `#F5F3FF`, secondary 70%, muted 50%.
- **Red** `#E5243B` is a **signal**, not a colour: live, alert and breaking
  states only. If something red is not reporting a state, it is wrong.
- **Glass**: white 4%, 1px white 8% border, blur 12px, radius 18px. One card.
- **Three fonts, three roles**: Tomorrow for uppercase headlines, Space Mono
  for labels and meta (never below 12px), Space Grotesk for body. No serif.
- **Grid**: 12 columns, container 1440px, padding 24px mobile / 48px desktop.
  Layout A is text 5 + graphic 7 (graphic may bleed right); layout B is a
  centred headline over a full-width graphic.

## The map in 01

Section 01 does **not** use `data/countries-110m.json`, which the globe draws
from. Natural Earth renders India without Jammu & Kashmir and Ladakh, and a
map published in India has to show the official boundary.

`data/india-boundary.json` is the **official boundary of India as per the
Survey of India** — J&K, Ladakh, Aksai Chin and the island territories
included — simplified from `datameet/maps` `Country/india-composite.geojson`,
which is CC-0. 252,604 points became 5,616 and 10.7 MB became 86 kB; at a dot
grid about 420px across the two are indistinguishable.

`tools/build-india-map.js` is the generator. **It is not a build step** — the
site still has no toolchain — and the file it writes is committed. Run it only
if the source changes.

## Verification status

Verified with no runtime errors at **1920×960, 1440×900, 1366×657, 1280×720,
1024×768, 820×1180, 390×844, 360×740** and **844×390** (phone landscape):

- no section taller than the window, no section with vertical or horizontal
  overflow, no horizontal page scroll;
- every section reaches `.is-in` and no revealed element is left hidden;
- the hero title fully visible, clearing the header, after scroll down → up
  **and** after a reload at mid-page → up;
- no element anywhere with `cursor: none`; no `[FROM CLIENT]` markers left;
- the footer at 63–97% of the window (budget: 100svh).

The interactive sweep ran at each size before re-measuring: all six monitor
scenes in 02, all five comparison tabs in 06, all six segments in 07, both
letters in 08, all seven questions in 11, and all three flow nodes in 04.

**Measure elements, not just sections.** The section-level check above has a
blind spot: a grid item that overflows inside a `min-height: 0` grid does not
grow its section, so the section still reports "fits". That is how four rate
cards in a three-column grid went unnoticed while each one spilled 120px over
its own box and painted across the card below. Run this too:

```js
const SKIP = '.marquee,.page-bg,.layer-back,.cta-globe,.rail,.rates,.pxm,' +
             '.post__art,.vidslot,.deck__card,.tile__art,.hero,svg,.shot';
document.querySelectorAll('main *, .ed-footer *').forEach((el) => {
  if (el.closest(SKIP) || el.matches(SKIP)) return;
  const y = el.scrollHeight - el.clientHeight, x = el.scrollWidth - el.clientWidth;
  if ((y > 12 || x > 12) && el.clientHeight) console.log(el, 'y' + y, 'x' + x);
});
```

Everything in `SKIP` overflows on purpose — a marquee, a bleeding graphic, a
picture oversized to have somewhere to parallax. Anything else is a bug.

**Neutralise the reveal before measuring**, or every container will report
about 24px of overflow that is only an un-run `translateY`:

```js
document.head.insertAdjacentHTML('beforeend',
  '<style>[data-in],[data-hero-in],.line-inner{opacity:1!important;' +
  'transform:none!important;transition:none!important}</style>');
```

Paste this into the console after any edit:

```js
document.querySelectorAll('main > section').forEach((s, i) => {
  const h = s.getBoundingClientRect().height, over = s.scrollHeight - s.clientHeight;
  console.log(i, s.id, (h > innerHeight + 1 || over > 1) ? 'TOO TALL' : 'fits');
});
```

**Not verified in this pass:** Lighthouse and `prefers-reduced-motion` (read
in the rules, not emulated). Measure Lighthouse **after** the real assets are
in — the dummies are full-size third-party JPEGs and will dominate any number
taken now. See HANDOFF §7.
