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
css/
  styles.css          all styles — edit directly, nothing to compile
  fonts.css           @font-face rules for the self-hosted fonts
js/
  main.js             entry point
  lib/motion.js       gsap/ScrollTrigger, onScrub, onInView, easings
  lib/content.js      the copy the scripts need as data
  lib/world.js        Natural Earth land geometry
  ui/edition.js       page-wide: reveal, ambient, parallax, counters, media
  ui/panels.js        the four swapping panels (02, 07, 08, 11)
  ui/chrome.js        header, overlay menu, section label, cursor ring
  scenes/dots.js      the canvas toolkit + the two ambient dot fields
  scenes/network.js   01 · the dot-matrix map of India
  scenes/bento.js     03 · tile tilt and the micro-UI gate
  scenes/flow.js      04 · the fibre path, and 09's rate-card lines
  scenes/live.js      05 · counter, auto-scaling nodes, sparkline
  scenes/versus.js    06 · the draggable split
  scenes/globe.js     the hero globe (Three.js, lazy), used twice
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
- **Parallax**: back 0.3, mid 0.7, chips 1.15, capped at ±80px. Content itself
  is never parallaxed.
- **Ambient loops only in view.** Every canvas loop and every CSS micro-UI is
  gated on an IntersectionObserver. Twelve sections of animation running at
  once is how a phone loses 60fps.
- **`prefers-reduced-motion`**: no parallax, no loops, videos never load, the
  reveal becomes an opacity fade and every scrubbed graphic draws its finished
  state.

## Assets — the client still owes these

Every image and video path in the page is a placeholder from the brief. **The
page is built so their absence is invisible**, and so that dropping the files
in is the only step needed:

| Path | Used by |
|---|---|
| `assets/video/live-newsroom.mp4` | 05's back layer |
| `assets/video/cta-press.mp4` | 12's back layer |
| `assets/img/case-dailythanthi.webp` + `-hansindia` `-livelaw` `-mediaone` `-factcheck` | 07's device frame |
| `assets/img/testimonial-kavitha-iyer.webp`, `-sanjay-bhat` | 08's portrait |
| `assets/img/post-tamil-daily.webp`, `-ai-editor`, `-wordpress-seo` | 10's cards |
| `assets/logos/<publisher>.svg` | 01's two marquees, which currently set the names as type |

**Videos** carry `data-src`, load only in view and fade in only on `canplay`,
over a drawn fallback that is always there. **Images** sit on top of a drawn
stand-in built from the same DNA; `initImages()` hides any whose file 404s, and
`setImage()` remembers the failures so a tab switch does not re-request them.
A 404 on these paths costs one console line and changes nothing on screen.

Videos should be MP4 + WebM, 1920×1080, 8–12s seamless loop, ≤3MB, with a
poster. Images AVIF/WebP with width/height set. Logos white monochrome SVG.

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

## Verification status

Verified with no runtime errors at **1920×960, 1440×900, 1366×657, 1280×720,
1024×768, 820×1180, 390×844, 360×740** and **844×390** (phone landscape):

- no section taller than the window, no section with vertical or horizontal
  overflow, no horizontal page scroll;
- every section reaches `.is-in` and no revealed element is left hidden;
- the footer at 52–88% of the window (budget: 100svh);
- the content block at 86% of each section at 1440×900 (budget: 75%).

The interactive sweep ran at each size: all six monitor scenes in 02, all five
segments in 07, all seven questions in 11, and the letters in 08, with every
section re-measured afterwards.

Paste this into the console after any edit:

```js
document.querySelectorAll('main > section').forEach((s, i) => {
  const h = s.getBoundingClientRect().height, over = s.scrollHeight - s.clientHeight;
  console.log(i, s.id, (h > innerHeight + 1 || over > 1) ? 'TOO TALL' : 'fits');
});
```

**Not verified in this pass:** Lighthouse (no headless Chrome in the
environment) and `prefers-reduced-motion` (checked by reading the rules, not by
emulating the media query). Both are worth half an hour on a real machine
before release — see HANDOFF §7.
