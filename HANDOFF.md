# Handoff — Blink CMS one-page site

Written 26 Sep 2026, updated the same day after section 04 went digital.
Read this plus `README.md` before changing anything.
`README.md` is the permanent doc (stack, structure, how to run). This file is
the session context: **what was decided and why**, what's unverified, and what
is still open.

---

## 1 · What this is

A single-page marketing site for Blink CMS, built to the structure and motion
system of unitedcarriers.com but told through a news story rather than a
shipping container: **Monitor → Gather → Create → Publish → Monetize → Analyze.**

Thirteen sections, in page order:

```
00 preloader (overlay)   06 press          (#press)
01 hero      (#hero)     07 letters        (#letters)
02 front page(#front-page)08 masthead wall (#case-studies)
03 desk      (#desk)     09 the wire       (#the-wire)
04 platform  (#platform) 10 faq            (#faq)
05 live      (#live)     11 on air         (#on-air)
                         12 footer         (#contact)
```

~31,000px of scroll at 1440×900. Four pinned, scroll-scrubbed scenes: desk,
platform, press, plus the hero's sky transition.

---

## 2 · Current state

**Plain HTML, CSS and JavaScript. No framework, no build step, no runtime
dependencies, no CDN.** 61 files. Drop the folder on any static host.

It must be *served* (ES modules + `fetch` don't work from `file://`):

```bash
node server.js      # → http://localhost:8080
```

### Git

All committed on `master`, working tree clean. The digital Desk, the header
logo and this file landed as three commits; section 04's rail was built on
`claude/section-04-conveyor-digital-291321` and merged in. Nothing is pushed —
there is no remote configured.

The only merge conflict was in `README.md`, where both sides had edited
neighbouring rows of the scenes table. If you branch again, expect that table
and `index.html`'s section blocks to be the contended spots.

---

## 3 · How it got here (don't undo these)

The project was migrated twice at the user's request. Both migrations are
complete; there are no leftovers from either.

1. **Next.js 15 + React 19 + Tailwind v4** — original build.
2. **Tailwind → Bootstrap 5.3 (SCSS)** — user asked for Bootstrap.
3. **Next/React removed → plain static site** — user's client wants "normal
   html css js".
4. **Unused files/exports/fonts pruned.**

### Decisions that will look odd without context

- **`$spacers` is redefined to Tailwind's numeric scale** (`1 = .25rem` …
  `12 = 3rem`), *not* Bootstrap's stock 1–5. This is what let the spacing
  survive the Tailwind→Bootstrap migration unchanged. Don't "fix" it.
- **Breakpoints are Tailwind's** (sm 640 / md 768 / lg 1024), not Bootstrap's.
- **`$position-values` is extended with the spacing scale** so `bottom-7` works;
  stock Bootstrap only ships `0/50/100`.
- **The type scale is `.t-hero` … `.t-giant`**, deliberately *not* `.d-*`, which
  would collide visually with Bootstrap's `d-*` display utilities.
- **The utilities API is imported last** in `scss/main.scss`, so utilities
  override component classes. New component CSS goes in the partials, never
  below that import.
- **No Bootstrap JS.** Accordion, tabs, menu and film modal are hand-written
  event handlers in `js/ui/widgets.js` / `chrome.js`. Bootstrap's JS manipulates
  the DOM and there is no React here to fight, but the hand-rolled versions are
  smaller and already done.
- **Fonts are self-hosted**, lifted out of the old `next/font` build into
  `fonts/` + `css/fonts.css`. The page needs no network at runtime.
- **Three.js is lazy-loaded** via dynamic `import()` kicked off at boot (not at
  preloader release — that left the hero empty for ~8s). `modulepreload` hints
  are in `<head>`.

---

## 4 · Bugs already found and fixed

Listed so they don't get reintroduced.

| Bug | Cause | Fix |
|---|---|---|
| Every Tailwind spacing utility dead | `* { padding: 0 }` sat outside Tailwind's layers and beat them | Reset moved into `@layer base` |
| Custom cursor invisible | `svg { max-width: 100% }` resolved to 0 inside the cursor's zero-width anchor | `svg` dropped from that rule; cursor SVGs pinned with explicit px + `max-width: none` |
| Page could stay scroll-locked | Preloader was entirely rAF-driven; rAF is suspended in background tabs | Countdown is timer-driven, plus a 7s failsafe in `main.js` |
| No pointer at all on script failure | `cursor: none` was unconditional | Gated on `[data-custom-cursor]`, set by `Cursor` on mount |
| Font classes merged into one | A bulk rewrite ate the spaces around `${}` in template-literal classNames | All nine repaired |
| Press never dissolved | `globalAlpha` set negative — Canvas silently ignores invalid values | Clamped with `Math.max(0, …)` |
| Globe opened on the Americas | Hand-tuned yaw that didn't match the bureaus | Derived: `yawFor(lon) = -(lon + 90)°`, `START_LON = 78` |
| Front-page headline clipped | Text overflowed the column and `.line-mask { overflow: hidden }` cut it; past the 1560px shell cap the `5vw` padding kept growing while the column didn't | Four explicit lines, `.front-head` clamp tuned to the column, `front-main` padding capped |
| Desk section looked like blank space | Scene faded in from zero, but the stage scrolls into view *before* the pin engages | Scene is fully composed at progress 0 |
| Hero globe gone on the way back up | The hero scrub tweened `[data-globe-wrap]`'s opacity, but that element is the *lazy reveal* — CSS holds it at 0 until the Three.js import resolves and `is-ready` fades it in. GSAP records a target's start value on the tween's first render and restores it when the playhead rewinds past the tween, so it recorded the pre-reveal 0 and wrote it back **inline** at the top, beating `.is-ready` | The dim moved to an inner `[data-globe-dim]` layer that always rests at opacity 1. Never animate the wrap's opacity — that property belongs to the reveal |
| 05 was mostly empty white | `.live-strip` was pinned to `min-height: 130vh` — 1170px at 1440×900 — while the column of entries beside it held ~800px. The rail ran 370px past the content, and the sticky left column is only ~280px tall, so two thirds of the section was blank | The rail stretches to the row instead, so it ends where the entries end |
| 05's rail never met the sheet it feeds | Two separate misses, both there from the start: the row's own `sec-pad` left 90px of white between the rail's foot and `.live-feed`, and the sheet's apex is cut at `50%` of the section while the rail sat in an off-centre column — 56px apart at 1440 | The row is 4/4/4, which puts the rail on the page's centre line, and the rail takes an extra `10vh` to cross the row's padding. Measured: 0px gap, 0px offset, and the 92px rail meets the 92px apex |
| 05 and 07's headlines had their tails sliced off | Same trap as the front page, twice more. A `.t-*` size scales with the **viewport** while the column it sits in does not — past the 1560px shell cap the column stops growing entirely. A word wider than its column overflows, and `.line-mask { overflow: hidden }` cuts it: 05 read `RELIABIL / ON EVERY / DEADLIN`, and 07 lost 104px of `NEWSROOMS` at 1920 | `.live-head` and `.letters-head`, each capped to what its column actually holds. **Any headline in a `col-*` narrower than the shell needs its own size, not a `.t-*`** — see the sweep below for how to check |
| Section 04's head sat on the ghost word | `.platform-word` was at `top: 6%` and the head starts at 0, so the giant letterforms ran straight through the section label and the standfirst | The word and the cards are anchored to the head — `calc(5vh + 76px)` and `calc(5vh + 162px)` — not to a percentage of the stage. A percentage tracks the stage, not the thing it has to clear, so it crept back into the head on short viewports |
| The cards' responsive tightening did nothing | The card carried the `p-4` utility. The utilities API is imported last and ships `!important`, so `p-4` beat every `padding` this file set — including the `!important` ones, on a later-wins tie | Padding is owned by `.platform-card` and the `p-4` class is gone. **If a component rule on these cards seems to be ignored, check for a utility class doing it first** |
| Platform cards 05 and 06 invisible on a phone | Six cards stacked one-up came to ~880px inside a `100svh` pin-stage that clips, so the last two were simply cut off. Predates the card redesign, which made it worse before it was found | The grid is `row-cols-2` on phones with a compact card below 640px: 549px for all six at 390×820, with room to spare |
| Screens overlapped on the conveyor | The rider wrap period wasn't a whole number of slots, so one coming back round the left landed between slots | Period is `slots × spacing`, with slots rounded up to a whole number of rider cycles |

---

## 5 · The scenes

All drawn in code — no image sequences, no renders to commission.

| Scene | File | Notes |
|---|---|---|
| Dotted globe | `js/scenes/globe.js` | Three.js points on **real Natural Earth land**; 23 pings arcing to Noida |
| Preloader map | `js/scenes/preloader.js` | Same land data, equirectangular, centred on India |
| Desk | `js/scenes/desk.js` | **Rebuilt digital** — see §6 |
| Conveyor | `js/scenes/conveyor.js` | **Rebuilt digital** — one delivery line, four channel taps, see §6 |
| Press | `js/scenes/press.js` | **Rebuilt digital** — the edition going out, see §6 |
| Reader signal | `js/scenes/reader-signal.js` | **Rebuilt digital** — the return trace, see §6 |
| Halftone wordmark | `js/scenes/halftone-wordmark.js` | Real halftone: type sampled, redrawn as dots sized by ink coverage |
| Back-page map | `js/scenes/back-page-map.js` | India picked out in violet |

2D scenes share `js/lib/canvas-scene.js` (dpr sizing, rAF loop, `setProgress`,
`setActive`). Loops pause when their section scrolls out of view.

### Globe pings (`js/lib/content.js`)

23 pings, two label tiers:

- **4 red + black headline tag** — the cities the brief names (Chennai, Kochi,
  Delhi, Guwahati). Tags are live HTML in `index.html`.
- **3 red + plain city label** — the brief's remaining bureaus (Hyderabad,
  Kozhikode, Bhopal).
- **16 violet + plain city label** — wire traffic (Mumbai, Kolkata, Colombo,
  Dhaka, Kathmandu, Dubai, Singapore, Tokyo, Sydney, Nairobi, Johannesburg,
  Frankfurt, London, New York, Toronto, São Paulo).

The colour split is deliberate and **honest**: red = a bureau the brief names,
violet = a dateline on the wire, implying no office there. Keep that rule if you
add cities.

---

## 6 · The digital scenes (03 and 04)

### The Desk (03)

The user confirmed **Blink CMS is digital-only — no print media**. The desk was
rebuilt around that: laptop writes, three screens publish. No paper, no
typewriter, no newspaper bundles.

```
p 0.02–0.44  headline types into the Blink editor (BLINKCMS in the AI sidebar)
p 0.48–0.80  a send dart (the messaging-UI paper-plane glyph) flies across
p 0.66/0.75/0.84  laptop → tablet → phone light up with the same article
```

- The editor keeps its text for the whole scene — it does **not** fade out.
- One `drawArticle()` renderer draws all four screens, so it's literally the
  same story at every size.
- Two layouts: `WIDE` (editor + laptop + tablet + phone) and `NARROW`
  (editor + phone, devices scaled 1.35×) below 900px.
- Plain contain-fit against a `1600 × 640` stage — an earlier 1.16× zoom cropped
  the phone off the right edge. Don't reintroduce a zoom multiplier without
  re-checking the right-hand device.
- **The wall map** fills what that stage leaves empty: a dotted world behind the
  devices, from the same Natural Earth geometry as the preloader map and the
  globe, so the page keeps one world. It is drawn in **canvas space, not on the
  fitted stage**, so it reaches the section's full width, and it is handed the
  desk line's y so it can shrink to nothing before it — the screens are never
  read against a busy background. `reducedMotion()` freezes all of its motion.
  ~5,000 dots batched into one path and one `fill()`; a full repaint measured
  0.39ms.
- **It sways; it does not drift**, and that is the whole reason the right-hand
  side stays occupied. A one-way drift walks the entire world past over about
  three minutes, so any framing you choose comes apart — the Pacific arrives and
  the section looks empty again. Measured over a full cycle every centring is
  identical, because the centring only picks the phase you happen to arrive at.
  Constraining the travel to ±90px is what makes the framing hold.
- **It is framed on 30°W (`MAP_LON`), not on the globe's `START_LON`.** That
  stands Europe, Africa and Siberia up the right-hand side: measured worst-case
  land in the top-right corner goes from 495 dots to 1515. The globe's opening
  angle is about where its camera starts — don't couple the two again.
- The **`CREATE · THE HEADLINE IS WRITTEN`** label sits top-right, offset 76px
  rather than on the spacing scale: the header is fixed, 55px tall and
  `z-index: 900`, so anything above ~60px is painted over by it.

### The Platform rail (04)

One delivery line runs the width of the section. Stories ride it left → right as
payloads of uneven size, and at a junction two thirds along, four taps branch
off and carry them to the lower right, where the section's own label names them:
`WEB · AMP · PWA · APP`. Everything the newsroom publishes goes down one line
and comes out on every channel — which is the section's whole claim.

**This is the second attempt.** The first one translated the print conveyor
element by element: the folded newspapers became a phone, a laptop, a tablet
and an e-paper reader riding the belt, the rollers became pulsing nodes, and so
on. Every piece had a counterpart and the result still made no sense — screens
do not ride conveyors, so it read as a factory belt in digital dress, and a row
of identical repeats underlined it. The dots below the belt answered to nothing
at all.

> **The lesson worth keeping:** translating a print scene element by element is
> a good method for a scene whose *structure* still holds (03, 06). Where the
> structure itself is the print metaphor, the translation inherits the
> nonsense. Ask what the section actually claims, and draw that.

- **The structure that does hold, and must be kept:** travel runs left → right
  with scroll, and the tilt at `p 0.82–1` widens the line into the ink strip
  that hands off to 05 · LIVE. That hand-off is why the tilt exists.
- The line keeps moving on `time` as well as `p`, or a still section reads as a
  diagram rather than something live.
- The payloads are **deliberately uneven** in width, height and gap. The
  identical repeats were most of why the old scene read as a belt.
- **The line has to clear the card grid**, which is opaque DOM over this canvas.
  At desktop widths the cards end near `0.63h` and `0.78h` is clear; two-up on a
  phone they run to about `0.89h`, and the old lane at `0.78h` was drawn
  entirely behind them — the scene was invisible on phones, as the belt also
  was. Narrow canvases put the line at `0.925h` and drop the channel fan, which
  has no room to read there. Measured clearance: 100px at 1440×900, and the
  payloads clear the cards at 390×820.
- The scene draws in **canvas space, not a fitted virtual stage** — it is
  full-bleed, and a contain-fit would letterbox the line's ends.
- Composed at progress 0, same as the Desk and for the same reason.
- `js/lib/article.js` now has **one** consumer, the Desk: the rail no longer
  draws full articles. It still earns its place — it holds the renderer and its
  copy comes from `content.js` — but the two-consumer argument for extracting
  it is gone.
- **The six cards** carry their accent as `--accent`, set inline per card, and
  the band, the index number, the icon plate and the foot sweep all read from
  that one value. The body copy is deliberately *not* `.mono-xs`: at 9.5px
  uppercase it read as a label rather than as a sentence. `margin-top: auto` on
  the body pins it to the foot so six cards of unequal copy still line up.
- **Section 04's vertical order is head → ghost word → cards → foot strip, and
  each clears the one above it.** Measured at 1440×900, 390×820 and 360×640, the
  head clears the word by 17px at all three. Under 760px tall a `max-height`
  query tightens the card and halves the row gutter, because otherwise three
  rows of cards run past the foot strip; that query sits *after* the width one,
  since a short phone matches both and the later rule wins.
- **A card's hover state must never animate `transform`.** GSAP owns that
  property for the flip-in and writes it inline, so a CSS hover transform is
  overwritten — the same trap as the hero globe in §4. Hover moves colour, and
  moves children (the foot sweep is its own element).
- `drawArticle` is now shared: it lives in **`js/lib/article.js`** and both
  scenes import it, so the claim that 03 and 04 show the same story is enforced
  by the code rather than by two copies agreeing. Its copy — the headline lines
  and the dateline — moved to `content.js`, where the project says runtime copy
  belongs. The dateline is dropped below a 150px surface, where it used to
  render at its 6px floor and run into the edge; that removed it from the Desk's
  phone, which is the one intentional visual change from the extraction.
- **Still duplicated:** `roundRect` and the wake-rim logic in `desk.js` and
  `conveyor.js`. The contact shadows deliberately differ — the Desk casts a dark
  shadow on a white desk, the rail pools light on ink — so those are not the
  same function and should not be merged.

---

### Letters (07)

Two print things lived here: a giant paper plane folded from a front page, and
the results set as clippings — newsprint, with a torn top edge cut from a
`#tear` sprite, as though snipped out and pinned up.

| was | is |
|---|---|
| the plane, flown along a bezier | `reader-signal.js` — a return trace that rises as the section scrolls |
| print still showing on its wing | response marks that light as the trace passes them |
| newsprint clippings with torn edges | `.result` readouts: white, hairline, an accent rail where the tear was |

- **The trace carries no axis, scale or number, and must not gain any.** The
  numbers in this section are the supplied case-study results in the DOM; the
  canvas is texture behind them. A background that looks like a chart of its
  own would be inventing data, which §10 forbids.
- The scene is renamed, unlike 06's: `THE PRESS` means the news media, so the
  word survived the machine, but `paper-plane.js` describing a rising signal
  would just be a lie. `data-scene="signal"`, `mountReaderSignal`.
- The `#tear` symbol is gone from the sprite — nothing referenced it once the
  clippings became readouts.
- All the copy is untouched, including the standing note that the results are
  as supplied and no quotes are attributed.

### The Press (06)

The machine is gone; the section is not. Each print element was replaced, so
the scene still has the shape `main.js` scrubs it through:

| was | is |
|---|---|
| paper web racing up | the published feed, one story card after another |
| rollers across the bed | relays the feed hops through, with a node at each end |
| ink-lit machine bed | the same violet light, now the network's |
| burst of ~320 flying pages | the story landing on ~320 readers' screens |
| — | a fan-out from the centre to endpoint screens, as the camera pulls back |

- **Keep the phases.** `p 0–0.5` the feed runs under the centred headline,
  `0.5–0.84` the camera pulls back while the five features come in around the
  edges, `0.82–1` it bursts and clears so the white flash at `0.93` lands on an
  empty frame. The timeline in `main.js` is written against those numbers.
- **The centre got darker on purpose.** The headline over this canvas is white,
  and the old paper web put a sheet of newsprint behind it — measured at 154
  mean luma with 60% of pixels above 150. The dark bus reads 39 and 4%.
- The burst particles are screens now, not sheets, so they tumble far less —
  paper flutters, a phone does not.

### 05 · LIVE

Rebuilt around the rail as a spine rather than three loose columns.

- **The row is 4/4/4 and that is load-bearing**, not a style choice: it is what
  puts the ink rail on the page's centre line, where `.live-feed__sheet`'s apex
  is cut. Change the split and the hand-off to 06 stops lining up.
- **The rail's height comes from the row**, plus `10vh` to cross the row's
  bottom padding. Nothing about it is a viewport height any more — see §4 for
  what the old `130vh` did.
- The three entries hang off a spine with a tick each, and reuse the platform
  cards' stamped plate so 04 and 05 read as one system. Their titles are
  deliberately sized *below* the section headline; at `.t-md` they ran to 49px
  against the headline's 57px and read as three competing headlines.
- The `MONITORED ROUND THE CLOCK` note moved to the left column, which had
  nothing under its standfirst.
- **No copy was invented.** Everything here is the copy that was already in the
  section, rearranged — the live card is still the labelled sample text.

---

## 6b · Navigation — the approved 15-page IA

The menu and the footer were rewired to the approved sitemap. **The site is
still one page, so every one of these links 404s until that page exists.** This
was a deliberate call: the nav now states the agreed structure rather than the
old in-page anchors. If the pages are not coming soon, point them back at
anchors or the links should come out.

Every destination referenced, and the approved page it belongs to:

| link | page |
|---|---|
| `/` | 1 · Home — this file |
| `/platform/` (+ `#the-reporter` … `#the-analyst`) | 2 · Platform / Product |
| `/pricing/` | 3 · Pricing |
| `/case-studies/` | 4 · Case Studies index |
| `/case-studies/daily-thanthi/`, `/the-hans-india/`, `/livelaw/`, `/the-federal/`, `/madhyamam/` | 5 · Case Study detail |
| `/about/` | 6 · About Us |
| `/contact/` | 7 · Contact / Book a Demo |
| `/careers/` | 8 · Careers index |
| `/blog/` | 10 · Blog index |
| `/reports/` | 11 · Reports listing |
| `/roundups/` | 12 · Roundups listing |
| `/legal/privacy/`, `/legal/terms/`, `/legal/cookies/` | 15 · Legal templates |

Not linked, correctly: 9 · job detail and 13 · article detail are templates
reached from their listings, and 14 · the 404 page is reached by failing.

- The overlay menu is **six top-level items**, which is what the existing
  reveal was built for — the stagger loop runs `1 through 6`. Three of them
  carry a `.menu-sub` row. Adding a seventh means extending that loop.
- The stagger now keys off `.menu-item:nth-child()`, not the link: each link
  sits in its own wrapper so a submenu can hang under it, which made every
  `.menu-link` a first child and flattened the delays to one value.
- **`BOOK A DEMO` still points at `#on-air`**, the on-page section. It was not
  part of the nav rewire; decide whether it should go to `/contact/`.
- The header's `LIVE` indicator is gone — the menu button took its place, per
  the approved change — and the button is no longer absolutely centred.

---

## 7 · Open items

### Still print

**Nothing.** 03, 04, 06 and 07 are all done — see §6. The site draws no paper,
no press and no newsprint surface anywhere.

Four worked examples now. The method that holds: replace each print element
with its digital counterpart and keep the scene's structure and its hand-off to
the next section, rather than deleting and starting over. The scroll timeline in
`main.js` expects the phases it already has, so keeping them is what lets the
scene change without the section's choreography changing.

**Editorial language is not print language.** `THE PRESS` stayed as 06's label:
the labels are newspaper sections (`FRONT PAGE`, `LIVE`, `CLASSIFIEDS`,
`BACK PAGE`), and the press means the news media. What changed there was the
machine, not the word. Same reasoning as masthead and front page below.

**Editorial language stays** — the user confirmed masthead, dateline, byline,
front page, halftone, newsprint all read as journalism rather than print
production. Don't strip them.

### Kerala city names

The user asked to remove Kerala cities **from the preloader wire feed** — done
(Kochi→Mumbai, Kozhikode→Kolkata, plus Bengaluru and Jaipur added). They still
appear elsewhere, flagged to the user but not changed:

- `● BREAKING KOCHI` — a hero globe headline tag, verbatim from the brief
- `KOZHIKODE` — a red bureau label on the globe
- `MALAYALAM` — in the preloader language column (a language, not a city)

### Content gaps — all render in red mono as `[BRACKETS]`

- **F.A.Q answers** — 7 of 8 missing. The brief supplied only the questions plus
  one answer ("Do you charge more as traffic grows?" → "No. Billing is by features.")
- **The Wire** — 4 headlines supplied, 2 slots empty, no article bodies
- **Footer email and phone**

### Asset slots

Brand film (modal), newsroom footage (front page thumb), B&W newsroom photo
(footer), publisher logos (masthead wall currently sets names as type),
case-study photos (Letters).

### User's own edit — leave alone

The **breaking-ticker strip under the header is commented out** in `index.html`.
That was the user's change, not ours. `initHeader()` already guards for it being
absent. Don't restore it without asking.

---

## 8 · Verification status

**Verified** at 1440×900 and 375×812, no console errors: preloader → globe
hand-off, self-hosted fonts, all pinned canvases drawing, the Desk scene frame
by frame at p = 0 / 0.46 / 0.62 / 0.99 (both layouts), masthead tabs, F.A.Q
accordion, tickers, custom cursor, header at scroll 0, no horizontal overflow,
headline fit from 1024px to 2560px.

**Also verified** (section 04, via the frame-capture method in §9): the rail at
1440×900 and 375×812 across p = 0 / 0.15 / 0.3 / 0.45 / 0.55 / 0.6 / 0.82 / 0.9 /
0.96 / 1, including the tilt to top-down and the channel chips, no console
errors. And the hero globe's return trip — the wrap keeps its CSS opacity while
`[data-globe-dim]` goes 1 → 0.25 → 1 across repeated round trips.

**Not exhaustively verified:** the press (burst into flying pages) and the paper
plane's full flight path. Scroll those on a real screen.

---

## 9 · Environment gotchas

These cost a lot of time; they are about the tooling, not the site.

- **The preview pane does not composite canvas/WebGL into screenshots.** DOM
  renders fine, canvases come out blank or black. To actually see a canvas
  scene, temporarily add a POST endpoint to `server.js` that writes a PNG to
  disk, capture frames into an offscreen grid canvas in the page, POST it, and
  read the file. Remove the endpoint afterwards.
- **`requestAnimationFrame` throttles when the pane isn't painting.** In-pane
  the preloader falls through to its 7-second failsafe; on a real screen it
  completes in ~4.5s. `getComputedStyle` readings can also go stale — if an
  inline style you just set reads back as the old value, the readback is stale,
  not the CSS.
  - Useful consequence: `mountScene`'s `setProgress` **paints synchronously**
    while the loop is paused, so a capture harness needs no rAF at all. Awaiting
    one will just hang.
  - CSS **transitions are frozen** too, so a lazily-revealed element can read as
    `opacity: 0` long after its class landed. That is the pane, not a bug — but
    it is also what makes the §4 globe bug reproducible on demand.
- **An offscreen capture canvas gets clamped.** The reset gives `canvas` a
  `max-width: 100%`, so a capture canvas styled `width: 1440px` silently comes
  back at the pane's width — the frames look right but every proportion in them
  is wrong. Set `max-width: none` on it and assert the measured box before
  trusting a capture.
- **A hidden pane reports a 0×0 viewport**, so `100svh` resolves to 0, the
  pin-stages measure zero and ScrollTrigger pins them at that size — DOM
  geometry readings become meaningless. Call `resize_window` to set an explicit
  viewport before measuring anything, or work off the canvas captures instead.
- **Scrub timelines don't settle without rAF.** To test a scroll-driven
  timeline in-pane, drive it directly — `st.animation.progress(x)` — rather than
  moving the scroll position and hoping the scrub catches up.
- **Sweeping for clipped headlines.** Three of these have now been found by
  eye, one at a time. Paste this at a few widths (1024, 1440, 1920, 2560) and it
  finds them all at once:

  ```js
  [...document.querySelectorAll('.line-inner')]
    .filter((i) => i.scrollWidth > i.clientWidth)
    .map((i) => [i.closest('section,footer')?.id, i.textContent.trim(), i.scrollWidth - i.clientWidth])
  ```

  Use `scrollWidth` vs `clientWidth`, not a `Range` measurement: a range over a
  line that has wrapped returns the *wrapped* width, which equals the column and
  looks like a perfect fit. That misreading cost a wrong fix on 07 first time.
  Only a single unbreakable word can be clipped, so a multi-word line that wraps
  is fine — pin lines with `nowrap` only where the break is authored, as in 05.
- **`window.scrollTo` does not stick — Lenis owns the scroll position.** Use
  `window.__lenis.scrollTo(y, { immediate: true })`. `window.__ST` is
  ScrollTrigger. Both are dev-only handles.
- **Rebuilding CSS:** `npm run css` (needs `npm install` for sass + bootstrap,
  dev-only). `css/styles.css` is committed and ready to serve.
  - A worktree has no `node_modules` of its own. Rather than installing a second
    copy, compile with the main checkout's:
    `node ../../../node_modules/sass/sass.js scss/main.scss css/styles.css --load-path=../../../node_modules --no-source-map`.
    Bootstrap's own partials emit a wall of deprecation warnings; they are not
    yours. Check `git diff --stat css/styles.css` afterwards — if the diff is
    anything other than purely additive for what you changed, your sass version
    disagrees with whatever built the committed file.

---

## 10 · Content rules — hold these

- **No invented testimonials, people or quotes.** Section 07 shows results only,
  exactly as supplied, with a standing note that no quotes are attributed.
- The preloader wire feed and the live-blog card are labelled sample text.
- **Every headline is live HTML** — nothing baked into an image.
- Only facts from the Blink CMS brief. Anything else is a marked placeholder.
