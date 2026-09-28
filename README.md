# Blink CMS — one-page scroll story

A single-page marketing site for Blink CMS, built to the structure and motion
system of unitedcarriers.com but told through a news story rather than a
shipping container: **Monitor → Gather → Create → Publish → Monetize → Analyze.**

**Plain HTML, CSS and JavaScript. No framework, no build step, no runtime
dependencies.** Drop this folder on any static host and it works.

> Picking this up fresh? Read [HANDOFF.md](HANDOFF.md) first — it covers the
> decisions behind the setup, what is still open, and the tooling gotchas.

## Running it

**There is no build step and no dependencies.** The folder *is* the site — put
it behind any web server and it works. nginx, Apache, cPanel, S3, Netlify,
GitHub Pages and any CMS that serves static files will all take it as-is.

It does have to be *served over http*, though. The page uses ES modules and
`fetch`, and both are blocked on the `file://` origin, so **double-clicking
`index.html` will not give you the real page.** This is a browser security
rule, not a missing dependency — serving the folder is all it needs.

Opened from disk you get the static page instead: all the copy, none of the
scroll story, and a warning in the console explaining why. That fallback is
there to catch a worse case — if `js/main.js` ever fails to load after an
integration (moved files, a 404, a CSP that forbids modules), the preloader
would otherwise cover the site with a black screen forever. See "The boot
failsafe" below.

Anything that serves a directory will do:

```bash
npx serve .
```

```bash
python3 -m http.server 8080
```

```bash
php -S localhost:8080
```

Then open <http://localhost:8080>.

## What's in the folder

```
index.html            the whole page — all 16 sections as static markup
css/
  styles.css          all styles — edit directly, there is nothing to compile
  fonts.css           @font-face rules for the self-hosted fonts
js/
  main.js             entry point: boots the UI and the scroll story
  lib/                motion helpers, land geometry, canvas plumbing, copy
  ui/                 header, cursor, reveals, counters, accordion, tabs…
  scenes/             the canvas and WebGL scenes
vendor/               GSAP, ScrollTrigger, Lenis, Three.js, topojson-client
fonts/                Tomorrow, Space Grotesk, Space Mono, Playfair Display
data/                 Natural Earth 110m land geometry
assets/               logo, and the ON AIR background video (4.4MB, lazy-loaded)
.claude/              Claude Code tooling — not part of the site, safe to delete
```

Every one of those paths is **relative**, so the folder structure has to stay
intact. If your CMS rewrites or flattens asset URLs, fix the references in
`index.html` and `css/fonts.css` to match.

One thing to check when mounting this inside a larger site: the footer's
navigation links are **root-relative** (`/pricing/`, `/case-studies/livelaw/`
and about a dozen more). They are correct if the page is the site root, and
wrong if it is served from a subdirectory.

Nothing is fetched from a CDN **except the brand video**, which is a YouTube
embed in the "Watch video" modal. It is `youtube-nocookie.com` and carries no
`src` until someone opens the modal, so a reader who never presses play never
contacts YouTube — but behind a firewall that blocks it, the modal will be the
one thing on the page that does not work. Everything else still runs offline.

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
| Pipeline, end to end | `js/main.js` — `setupPipeline()`: inputs, six stages and audience channels on one rail; the curves are SVG drawn from the pills’ measured positions, the rest is CSS |
| The story on every screen | same file — ~320 reader screens burst outward and clear to white |
| Reader signal | `js/scenes/reader-signal.js` — a return trace that rises as the section scrolls, response marks lighting as it passes them; no axis, scale or number |
| Halftone wordmark | `js/scenes/halftone-wordmark.js` — the type is rendered offscreen, sampled, and redrawn as dots sized by ink coverage |

The 12 pixel-dot icons and the registration marks are an inline SVG sprite at
the top of `index.html`; elements reference them with `<use href="#px-mic">`.

## The boot failsafe

The preloader is a full-screen black overlay in the markup, and `js/main.js`
is what removes it. So anything that stops that module running leaves the
overlay covering the site permanently — the page looks dead.

`<noscript>` does not catch this. Scripting is *enabled* in the cases that
matter; it is the module specifically that fails to load:

- the page was opened from disk (`file://` blocks ES modules)
- a Content-Security-Policy forbids modules
- an integration moved the files and the path 404s

So there is a second guard. `js/main.js` sets `window.__blinkBooted` as its
first statement, and a small **classic** script at the end of `index.html`
checks the flag 1.5s after load. If it is missing, it puts `.boot-failed` on
`<html>` and logs why. That class applies the same rules `<noscript>` does:
drop the preloader, and open anything whose open state is normally
JavaScript's job.

It is deliberately not a module — a module guard would be blocked by the very
failure it exists to catch.

The result is the page as static markup: every headline, every answer, the
rate card and all the copy, with no scroll story and no canvas scenes. Two
groups of elements stay hidden on purpose, because JavaScript positions them
and showing them unplaced looks broken: the globe's `.ping-tag` labels and the
press scene's `.press-feature` callouts.

If you change what the preloader covers, or add anything that starts hidden
and is revealed by JS, add it to **both** style blocks at the top of
`index.html` — the `.boot-failed` one and the `<noscript>` one.

## Editing content

All copy is written directly into `index.html`, so the page reads correctly
with JavaScript disabled and search engines see everything. The only copy in
JavaScript is in `js/lib/content.js` — the bureau coordinates, the preloader's
sample wire feed, the globe's ping tags, the live-blog timestamps and the
headline the Desk types out, because the scenes need those as data.

## Editing the CSS

`css/styles.css` is the source. Edit it directly — there is no Sass, no build
and nothing to regenerate.

It was compiled from SCSS once; those sources and the Node toolchain were
removed on request, so the compiled file became the thing you maintain. It is
~12k lines, which is only navigable because of the banner comments that divide
it. In order:

| Block | |
|---|---|
| `BOOTSTRAP · REBOOT` | vendor — normalises the browser |
| `BOOTSTRAP · GRID` | vendor — `.container`, `.row`, `.col-*` |
| `BOOTSTRAP · HELPERS` | vendor — `.ratio`, `.text-truncate`… |
| `BLINK · TOKENS` | custom properties: colours, ink scale, accents |
| `BLINK · BASE` | element defaults |
| `BLINK · TYPE` | the type scale |
| `BLINK · UI` | hairlines, buttons, pills, cursor, ticker |
| `BLINK · LAYOUT` | the sections and their scenes — **most edits land here** |
| `BLINK · STATIC` | lists, tables, footer, modal |
| `BOOTSTRAP · UTILITIES` | vendor, generated, **all `!important`** |

Search for the banner, then work inside that block. The header at the top of
the file repeats this map.

Four Bootstrap decisions are baked into the generated output and will look
wrong without the explanation:

- **`$spacers` used Tailwind's numeric scale** (`1 = .25rem` … `12 = 3rem`), not
  Bootstrap's stock 1–5. So `.mt-7` is `1.75rem`.
- **Breakpoints are Tailwind's** (sm 640 / md 768 / lg 1024).
- **`$position-values` was extended with the spacing scale**, so `bottom-7`
  exists; stock Bootstrap only ships `0/50/100`.
- **The type scale is `.t-xl` … `.t-giant`**, deliberately not `.d-*`, which
  would read as Bootstrap's display utilities.

**The utilities block is last and carries `!important`**, so it beats every
component rule above it. Add component CSS in the `BLINK` blocks — anything
written below that banner will be overridden by the next utility class someone
puts in the markup.

If you would rather have the Sass back, the partials are recoverable from git
history; they were last present in the commit before "chore: drop the Node
toolchain".
## What still needs real assets

Marked in the UI so nothing reads as finished:

- **Publisher logos** — the masthead wall currently sets the names as
  mastheads; swap in SVGs if you have them
- **Case-study photos** — the Letters clipping slots

## What still needs real copy

Every gap is wrapped in `[SQUARE BRACKETS]` and renders in red mono on the page:

- **The Wire** — four headlines supplied, no article bodies

## Content rules held

- **The four letters in 09 are placeholder copy — invented names, roles and
  quotes.** The mastheads are real customers (all four are on the publisher
  wall), but the words are not theirs. **Nothing on screen says so any more**:
  this build is for internal review and the sample flag was removed on request.
  Restore that flag or swap in real quotes before this goes public — see
  HANDOFF §6d. Real verbatim quotes are recoverable at commit 761d3c3.
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
  That failsafe is inside the module, though, so it cannot help when the module
  itself never runs — see "The boot failsafe".
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
