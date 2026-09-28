# Blink CMS — one-page scroll story

A single-page marketing site for Blink CMS, built to the structure and motion
system of unitedcarriers.com but told through a news story rather than a
shipping container: **Monitor → Gather → Create → Publish → Monetize → Analyze.**

**Plain HTML, CSS and JavaScript. No framework, no build step, no runtime
dependencies.** Drop this folder on any static host and it works.

> Picking this up fresh? Read [HANDOFF.md](HANDOFF.md) first — it covers the
> decisions behind the setup, what is still open, and the tooling gotchas.

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
index.html            the whole page — all 16 sections as static markup
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
assets/               logo, and the ON AIR background film (4.4MB, lazy-loaded)
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
| Laptop → tablet → phone | `js/scenes/desk.js` — the headline types into the Blink editor, the finished story lifts off the screen and flies across the desk, then lights up a tablet and a phone with the same article. One article renderer draws all four surfaces, and a dotted world map sways behind them |
| The platform itself | `js/scenes/platform.js` — a dotted sea in perspective moving under a level ink deck that the six module cards stand on; each column’s water takes that module’s accent as its cards land, and the deck thickens into the ink strip that carries into HOW IT WORKS |
| The edition going out | `js/scenes/press.js` — the published feed races up a dark bus, hopping through violet-lit relays, then fans out to endpoint screens |
| The story on every screen | same file — ~320 reader screens burst outward and clear to white |
| Reader signal | `js/scenes/reader-signal.js` — a return trace that rises as the section scrolls, response marks lighting as it passes them; no axis, scale or number |
| Halftone wordmark | `js/scenes/halftone-wordmark.js` — the type is rendered offscreen, sampled, and redrawn as dots sized by ink coverage |

The 12 pixel-dot icons and the registration marks are an inline SVG sprite at
the top of `index.html`; elements reference them with `<use href="#px-mic">`.

## Editing content

All copy is written directly into `index.html`, so the page reads correctly
with JavaScript disabled and search engines see everything. The only copy in
JavaScript is in `js/lib/content.js` — the bureau coordinates, the preloader's
sample wire feed, the globe's ping tags, the live-blog timestamps and the
headline the Desk types out, because the scenes need those as data.

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
  (the ON AIR section does have its background film: `assets/videos/video_bg.mp4`)
- **Publisher logos** — the masthead wall currently sets the names as
  mastheads; swap in SVGs if you have them
- **Case-study photos** — the Letters clipping slots

## What still needs real copy

Every gap is wrapped in `[SQUARE BRACKETS]` and renders in red mono on the page:

- **The Wire** — four headlines supplied, no article bodies

## Content rules held

- **The four letters in 09 are placeholder copy — invented names, roles and
  quotes, attached to four real mastheads at the user’s request.** The section
  flags itself as sample in red mono, and that flag must stay until real quotes
  replace them. Real verbatim ones, from the case studies published at
  blinkcms.ai, are recoverable at commit 761d3c3.
- Nothing else on the page invents a person, a quote or a number.
- The preloader wire feed and the live-blog card are labelled sample text.
- Every headline is live HTML — nothing is baked into an image.
- **The F.A.Q answers and the rate card are sourced from outside the brief.**
  The answers come from `Docs/Blink CMS - Feature List.pdf` plus copy already on
  the page; one gap is still marked in answer 03.
- **The rate card is sourced from outside the brief too.** Its four
  plans, prices, limits and small print come from
  <https://www.blinkcms.ai/pricing-page>, read 27 Sep 2026. Nothing in the
  build checks that against the live page, so if the rates move this section
  goes stale silently — re-read it before a release.
- `WHY NEWSROOMS LEAVE` makes no claim about any other product. Its left column
  is a question a publisher asks; its right column is Blink's own supplied
  answer. Keep that shape if you add rows.

## Behaviour notes

- Total scroll is roughly **33k px** at 1440×900. Pins shorten by about half
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
globe, desk, platform, press, masthead tabs, F.A.Q accordion, tickers, custom
cursor, self-hosted fonts and the full scroll length.

**Not exhaustively verified:** the very end of each pinned scene (the newspaper
landing on the bundles, the platform slab's rotation to edge-on, the press burst into
flying pages) and the reader signal's full rise. Scroll through those on a
real screen — they are the first things to look at.
