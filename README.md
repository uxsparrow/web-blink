# Blink CMS — one page, one edition

A single-page marketing site for Blink CMS. **Every section after the hero is
exactly one browser window tall, on one near-black background, with very little
text on it.**

That sentence is the whole design, and most of the decisions in this repo only
make sense against it. The page used to be sixteen sections that each had their
own background (black, white, cream, a map, a purple gradient, photographs),
their own typeface mix and their own scroll animation, and several of them ran
two or three screens long. It read as a row of different websites. This build
is eleven sections that share one frame.

**Plain HTML, CSS and JavaScript. No framework, no build step, no runtime
dependencies.** Drop this folder on any static host and it works.

> Picking this up fresh? Read [HANDOFF.md](HANDOFF.md) first — §0 covers the
> redesign, and the sections after it are the history of what came before.

## Running it

**There is no build step and no dependencies.** The folder *is* the site — put
it behind any web server and it works. nginx, Apache, cPanel, S3, Netlify,
GitHub Pages and any CMS that serves static files will all take it as-is.

It does have to be *served over http*, though. The page uses ES modules and
`fetch`, and both are blocked on the `file://` origin, so **double-clicking
`index.html` will not give you the real page.** This is a browser security
rule, not a missing dependency — serving the folder is all it needs.

Opened from disk you get the static page instead: all the copy, no hero globe,
no reveals, and a warning in the console explaining why. See "The boot
failsafe" below.

Anything that serves a directory will do:

```bash
npx serve .
```

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## What's in the folder

```
index.html            the whole page — hero, eleven sections, footer
css/
  styles.css          all styles — edit directly, there is nothing to compile
  fonts.css           @font-face rules for the self-hosted fonts
js/
  main.js             entry point
  lib/motion.js       reducedMotion, onInView, onScroll, easings
  lib/content.js      the copy the scripts need as data
  lib/world.js        land geometry for the globe and preloader
  ui/chrome.js        header, overlay menu, section label, cursor ring
  ui/edition.js       every section's behaviour, in one file
  scenes/globe.js     the hero globe (Three.js, lazy)
  scenes/preloader.js the intro
vendor/               Three.js, topojson-client
fonts/                Tomorrow, Space Grotesk, Space Mono
```

## The three rules

Read `BLINK · EDITION` in `css/styles.css` before changing anything below the
hero. Its banner states the rules and the rest of this section is why they
matter.

**1 · One screen.** `.ed` is `height: 100svh` and centres its content. That
only works if the content genuinely fits, which is why almost every size in
that block is a `clamp()` whose middle term is in `svh` — the page scales with
the window's **height**, not only its width. A short laptop window gets smaller
type and tighter gaps rather than a section running off the bottom.

Several of those clamps are `min(Xsvh, Yvw)`. Height alone is not enough: a
360×740 phone has plenty of `svh` and no room across, and sizing a headline or
a stat figure off height alone put it through the side of its own box. If you
add a display-sized element, cap it both ways.

Three height breakpoints take content away as the window gets shorter —
800px drops support lines, 680px thins grids and lists, and 520px (phone
landscape) gives up on one-screen and lets the sections grow, because a 390px
window cannot hold a headline, a module and a label without shrinking one of
them to nothing. Clipping would be worse than scrolling.

**Nothing uses `overflow: hidden` to fake a fit.** If a section ever reports
`scrollHeight > clientHeight`, the content is wrong, not the frame. Run the
check in "Verification status".

**2 · One background.** No section sets a background. The near-black comes from
`<body>`; the purple comes from one fixed `.ambient` layer at `z-index: -1`,
whose two blurred gradients drift with scroll and sit at full strength at the
hero and the closing CTA, softer in between. A dot grid at 3.5% runs over the
whole thing. That is the entire background system — no bands, no dividers, no
transition shapes, and nothing opaque on a section, which would hide the layer.

**3 · One motion.** `[data-in]` plus `.is-in` is the only entry animation:
fade in, up 24px, 600ms, staggered 80ms by each element's `--i`. Everything
else that moves is on a short list — the ambient drift, the stat count-up, the
one line that draws in 05, the LIVE dot's pulse, and the 300ms cross-fades when
a panel or a carousel swaps.

The hero keeps its own headline roll-up, and that is the only exception. It is
part of the hero, which was explicitly not up for redesign.

## The section template

```
<section class="ed ed--a|b">          one window tall, content centred
  <div class="shell">
    <div class="ed__grid">
      <div class="ed__head">          eyebrow → headline → optional support
      <div>                           ONE module
```

Two layouts only: **A** is headline left, module right; **B** is headline
centred above the module. Below 1024px both are the same single column.

One card component (`.card`), one carousel (`.rail`), one swapping panel
(`.qa__panel`, used by both 02 and 10), one marquee. A new section should need
no new CSS and no new JavaScript.

### Why the panels are fixed-height and not accordions

An accordion changes its section's height when it opens, and a section that
changes height cannot be promised to fit the window. 02, 10 and 08 all use a
fixed box whose contents cross-fade in 300ms instead, so choosing an answer or
paging to the next quote moves nothing on screen.

The consequence: **the longest answer has to fit the box at every width.** That
is what the `min(svh, vw)` caps on `.qa__a` and `.quote__text` are for, and it
is the thing to re-check if you edit that copy.

### Why the sections use `.shell` and not a 1280px container

The redesign brief asked for both a 1280px container and the same left edge in
every section — and the hero, which could not change, sits in `.shell`'s
1560px. A centred 1280px column and a centred 1560px column cannot share a left
edge. The left edge is the thing a reader notices scrolling from one section to
the next, so the sections took the hero's container and the text inside is
capped in `ch` or `px` instead.

## Libraries

| | | |
|---|---|---|
| topojson-client | 7 kB | decodes the land geometry for the globe |
| Three.js | 703 kB | the hero globe only — **lazy-loaded**, never blocks first paint |

**GSAP, ScrollTrigger and Lenis were removed** with the per-section scroll
scenes they drove. Nothing left on the page needs them: the entry animation is
a CSS transition armed by an `IntersectionObserver`, the count-up and the
ambient drift are a dozen lines of `requestAnimationFrame` each, and the drawn
line in 05 is a CSS transform.

Smooth scrolling is `scroll-behavior: smooth` in the stylesheet rather than
Lenis, which matters: Lenis owns the scroll position and fights the optional
`scroll-snap-type: y proximity` the sections use on desktop.

## The boot failsafe

The preloader is a full-screen overlay in the markup and `js/main.js` removes
it, so anything that stops that module running would leave it covering the
site. Since the redesign there is a second thing at stake: a tiny classic
script in `<head>` puts `.js` on `<html>`, which is what arms the entry
animation by setting `[data-in]` to `opacity: 0`. If the module then never
runs, every revealed element stays invisible.

`<noscript>` only covers the first case — scripting is *enabled* in the ones
that matter, and it is the module specifically that fails:

- the page was opened from disk (`file://` blocks ES modules)
- a Content-Security-Policy forbids modules
- an integration moved the files and the path 404s

So `js/main.js` sets `window.__blinkBooted` as its first statement, and a
classic script at the end of `index.html` checks the flag 1.5s after load. If
it is missing it puts `.boot-failed` on `<html>`, which drops the preloader,
shows the globe's wrapper and puts every `[data-in]` element and headline line
back at rest. It is deliberately not a module — a module guard would be blocked
by the very failure it exists to catch.

**If you add anything that starts hidden and is revealed by JavaScript, add it
to the `.boot-failed` block too.**

## Editing content

All copy is written directly into `index.html`, so the page reads correctly
with JavaScript disabled and search engines see everything. The only copy in
JavaScript is `js/lib/content.js`: the bureau coordinates, the preloader's
sample wire feed, the globe's ping tags, and the two letters in 08 — a carousel
showing one item at a time has nowhere in the markup to put the others, so the
first is in the HTML and the rest are data.

**The text rules are tight, and they are the point of the redesign:**

| | |
|---|---|
| Eyebrow | 1–3 words |
| Headline | max 6 words, max 2 lines |
| Support line | max 12 words, one line on desktop — optional |
| Card | title 1–3 words + descriptor max 6 words |
| List item, answer, quote | max 20 words |
| Whole section | about 40 words, numbers and logos excluded |

No paragraphs anywhere, and no point repeated between sections.

## Editing the CSS

`css/styles.css` is the source. Edit it directly — there is no Sass, no build
and nothing to regenerate. The banner comments divide it:

| Block | |
|---|---|
| `BOOTSTRAP · REBOOT / GRID / HELPERS` | vendor |
| `BLINK · TOKENS` | every colour, font and measure the page may use |
| `BLINK · BASE` | element defaults |
| `BLINK · TYPE` | the type scale |
| `BLINK · UI` | pills, the LIVE dot, the marquee |
| `BLINK · LAYOUT` / `BLINK · STATIC` | the chrome and the hero |
| `BLINK · EDITION` | **every section after the hero — start here** |
| `BOOTSTRAP · UTILITIES` | vendor, generated, **all `!important`** |

Four Bootstrap decisions are baked into the generated output and will look
wrong without the explanation:

- **`$spacers` used Tailwind's numeric scale** (`1 = .25rem` … `12 = 3rem`), not
  Bootstrap's stock 1–5. So `.mt-7` is `1.75rem`.
- **Breakpoints are Tailwind's** (sm 640 / md 768 / lg 1024).
- **`$position-values` was extended with the spacing scale**, so `bottom-7`
  exists; stock Bootstrap only ships `0/50/100`.
- **The type scale is `.t-xl` … `.t-giant`**, deliberately not `.d-*`.

**The utilities block is last and carries `!important`**, so it beats every
component rule above it. Add component CSS in the `BLINK` blocks.

## Tokens — what the page is allowed to use

- **Background** `#07060B`, set once on `<body>`. **Card** white 4% with a 1px
  white 8% border, hover border primary 40%.
- **Primary** `#6118EA`, **primary-light** `#B9A4FF`. **Text** `#F5F3FF`,
  secondary 65%, muted 45%.
- **Red** `#E10600` is for the pulsing LIVE dot in 06 **and nothing else**.
  The cursor ring used to be red and is now lavender for this reason.
- **Three fonts, three roles**: Tomorrow for uppercase headlines, Space Mono
  for eyebrows and labels, Space Grotesk for body. **There is no serif.** The
  Playfair face the old masthead wall and drop-caps used was deleted from
  `fonts.css` and from `fonts/`.
- **Headline treatment**: first part white, key phrase in `.head-lilac`, the
  hero's white→lavender gradient.

## What still needs real assets and copy

- **Publisher logos** — 08 sets the publisher names as type in the marquee.
  Swap in white monochrome SVGs at 60% opacity if you have them.
- **Case-study photos** — deliberately gone. The brief removed every photograph
  from the page; do not reintroduce one without re-reading the fit rules.

## Content rules held

- **The two letters in 08 are trimmed from placeholder copy — invented names,
  roles and quotes**, attributed to real customers. Nothing on screen says so.
  Swap in real quotes before this goes public — see HANDOFF §6d.
- Nothing else on the page invents a person, a quote or a number.
- The preloader wire feed is labelled sample text.
- Every headline is live HTML — nothing is baked into an image.
- **Section 01's figures come from the redesign brief, not from the old page**,
  which showed 150+ and 400% where the brief says 66+ and 396%. 66+ is labelled
  "newsrooms powered" while section 11 and the meta description both say 150+
  newsrooms. **Those two numbers contradict each other on one page** — see
  HANDOFF §7.
- 02 makes no claim about any other product. Its left column is a question a
  publisher asks; its right column is Blink's own supplied answer. Keep that
  shape if you add rows.

## Behaviour notes

- `prefers-reduced-motion` reduces every entry to an opacity fade, stops the
  ambient drift, writes the stats at their final value, swaps panels instantly
  and turns off smooth scroll.
- Scroll-snap is **proximity**, desktop only, fine pointer only, and off below
  601px of window height. Never make it `mandatory` — it fights every drag,
  keyboard scroll and in-page link.
- The globe's WebGL loop pauses when the hero scrolls out of view.
- The preloader is timer-driven with a 7-second failsafe, so a backgrounded tab
  can never leave the page scroll-locked. That failsafe is inside the module,
  so it cannot help when the module never runs — see "The boot failsafe".
- The native cursor is only hidden once the custom cursor has mounted, so a
  script failure leaves a normal pointer rather than none.
- The header no longer inverts. There is one background, so there is nothing to
  invert against; the second (dark-on-light) logo file was deleted with it.

## Verification status

Verified with no console errors at **1920×960, 1440×900, 1366×657, 1280×720,
1024×768, 820×1180, 390×844, 360×740 and 844×390** (phone landscape): no
section taller than the window, no element wider than its box, no horizontal
page scroll, and the footer at 41–60% of the window everywhere.

The interactive sweep was run at each of those sizes too — every answer in both
Q&A panels, both letters, and all six pipeline stages selected in turn, with
the panel re-measured after each one.

Paste this into the console to re-run the height check after any edit:

```js
document.querySelectorAll('main > section').forEach((s, i) => {
  const h = s.getBoundingClientRect().height, over = s.scrollHeight - s.clientHeight;
  console.log(i, s.id, (h > innerHeight + 1 || over > 1) ? 'TOO TALL' : 'fits');
});
```

**Not verified in this pass:** Lighthouse was not run (no headless Chrome in
the environment), and `prefers-reduced-motion` was checked by reading the rules
rather than by emulating the media query. Both are worth half an hour on a real
machine before release.
