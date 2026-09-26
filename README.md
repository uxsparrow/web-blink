# Blink CMS — one-page scroll story

A single-page marketing site for Blink CMS, built to the structure and motion
system of unitedcarriers.com but told through a news story rather than a
shipping container: **Monitor → Gather → Create → Publish → Monetize → Analyze.**

**Plain HTML, CSS and JavaScript. No framework, no build step, no runtime
dependencies.** Drop this folder on any static host and it works.

## Running it

The page uses ES modules and `fetch`, so it needs to be *served* — opening
`index.html` straight off the disk (`file://`) will not work. Any web server
does. A zero-dependency one is included:

```bash
node server.js
```

Then open <http://localhost:8080>. On a real host, just upload the folder —
nginx, Apache, cPanel, S3, Netlify, GitHub Pages all serve it as-is.

## What's in the folder

```
index.html            the whole page — all 13 sections as static markup
css/
  styles.css          compiled from scss/ — edit directly if you prefer
  fonts.css           @font-face rules for the self-hosted fonts
scss/                 source for styles.css (optional, see "Rebuilding the CSS")
js/
  main.js             entry point: boots the UI and the scroll story
  lib/                motion helpers, land geometry, canvas plumbing, copy
  ui/                 header, cursor, reveals, counters, accordion, tabs…
  scenes/             the canvas and WebGL scenes
vendor/               GSAP, ScrollTrigger, Lenis, Three.js, topojson-client
fonts/                Tomorrow, Space Grotesk, Space Mono, Playfair Display
data/                 Natural Earth 110m land geometry
server.js             local preview server (not needed in production)
.claude/              Claude Code preview config — safe to delete
```

Nothing is fetched from a CDN. The page works offline and behind a firewall.

## Libraries

Vendored into `vendor/`, loaded by `<script>` tags at the bottom of
`index.html`:

| | | |
|---|---|---|
| GSAP + ScrollTrigger | 115 kB | the scroll story and the pins |
| Lenis | 18 kB | smooth scroll |
| topojson-client | 7 kB | decodes the land geometry |
| Three.js | 703 kB | the hero globe only — **lazy-loaded**, never blocks first paint |

## The scenes are code, not renders

Every 3D/illustrated element is drawn at runtime, so there are no frame
sequences to produce or ship:

| Brief asset | How it's built |
|---|---|
| Dotted globe, pings, arcs | `js/scenes/globe.js` — Three.js points placed on **real land geometry**, red ping flares, bezier arcs back to Noida, headline tags projected to screen space |
| Bureau map + wire feed | `js/scenes/preloader.js` — Natural Earth land rasterised to a dot grid, centred on India |
| Typewriter → laptop → newspaper fold | `js/scenes/desk.js` — one canvas rig; the body silhouette lerps between machines, the page types letter by letter, then folds in two stages |
| Delivery rail + screens | `js/scenes/conveyor.js` — a phone, laptop, tablet and e-paper reader ride the rail, each waking with the same article the Desk wrote; the rail tilts top-down into the black strip that carries into LIVE |
| Top-down printing press | `js/scenes/press.js` — paper web with smeared colour photos, violet-lit rollers |
| Flying newspaper pages | same file — ~320 page particles burst out of the press and flutter away to white |
| Paper plane | `js/scenes/paper-plane.js` — folded from a front page, print still on the wing, flown along a bezier |
| Halftone wordmark | `js/scenes/halftone-wordmark.js` — the type is rendered offscreen, sampled, and redrawn as dots sized by ink coverage |

The 12 pixel-dot icons and the registration marks are an inline SVG sprite at
the top of `index.html`; elements reference them with `<use href="#px-mic">`.

## Editing content

All copy is written directly into `index.html`, so the page reads correctly
with JavaScript disabled and search engines see everything. The only copy in
JavaScript is in `js/lib/content.js` — the bureau coordinates, the preloader's
sample wire feed, the globe's ping tags and the live-blog timestamps, because
the scenes need those as data.

## Rebuilding the CSS

`css/styles.css` is committed and ready to serve — you only need this if you
want to change the SCSS sources.

```bash
npm install    # pulls sass + bootstrap, dev-only
npm run css    # or: npm run css:watch
```

Bootstrap 5.3 provides the grid, reboot and utilities. A few decisions worth
knowing before editing `scss/`:

- **`$spacers` is Tailwind's numeric scale** (`1 = .25rem` … `12 = 3rem`), not
  Bootstrap's stock 1–5.
- **Breakpoints are Tailwind's** (sm 640 / md 768 / lg 1024).
- **`$position-values` is extended with the spacing scale**, so `bottom-7`
  works; stock Bootstrap only ships `0/50/100`.
- **The type scale is `.t-hero` … `.t-giant`**, deliberately not `.d-*`, which
  would read as Bootstrap's display utilities.
- **The utilities API is imported last**, so utilities override component
  classes. Put new component CSS in the partials, not below that import.

## What still needs real assets

Marked in the UI so nothing reads as finished:

- **Brand film** — the "Watch the film" modal at the bottom of `index.html`
- **Newsroom footage** — the Front Page thumbnail
- **Newsroom photo (B&W)** — the footer
- **Publisher logos** — the masthead wall currently sets the names as
  mastheads; swap in SVGs if you have them
- **Case-study photos** — the Letters clipping slots

## What still needs real copy

Every gap is wrapped in `[SQUARE BRACKETS]` and renders in red mono on the page:

- **F.A.Q answers** — the brief supplied the eight questions and one answer
  ("Do you charge more as traffic grows?" → "No. Billing is by features.")
- **The Wire** — four headlines supplied, two slots empty, no article bodies
- **Footer email and phone**

## Content rules held

- No invented testimonials, people or quotes. The Letters section shows
  **results only**, exactly as supplied, with a standing note that no quotes
  are attributed.
- The preloader wire feed and the live-blog card are labelled sample text.
- Every headline is live HTML — nothing is baked into an image.

## Behaviour notes

- Total scroll is roughly **31k px** at 1440×900. Pins shorten by about half
  below 900px, via `gsap.matchMedia()` in `js/main.js`.
- `prefers-reduced-motion` collapses every pinned scene to a single key frame
  and disables smooth scroll.
- Canvas and WebGL loops pause when their section scrolls out of view.
- The preloader is timer-driven with a 7-second failsafe, so a backgrounded tab
  can never leave the page scroll-locked.
- The native cursor is only hidden once the custom cursor has mounted, so a
  script failure leaves a normal pointer rather than none.
- `window.__lenis` and `window.__ST` are exposed for console debugging. Plain
  `window.scrollTo` will not stick — Lenis owns the scroll position.

## Verification status

Verified at 1440×900 and 375×812 with no console errors: the preloader, hero
globe, desk, conveyor, press, masthead tabs, F.A.Q accordion, tickers, custom
cursor, self-hosted fonts and the full scroll length.

**Not exhaustively verified:** the very end of each pinned scene (the newspaper
landing on the bundles, the conveyor's tilt to top-down, the press burst into
flying pages) and the paper plane's full flight path. Scroll through those on a
real screen — they are the first things to look at.
