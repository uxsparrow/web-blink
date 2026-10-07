/**
 * Every image, video and logo on the page, in one place.
 *
 * The point of this file: nothing in the markup hard-codes a path. When the
 * real assets arrive, change `src` here and nothing else — no hunting through
 * index.html, no second place to forget.
 *
 * ── WHERE THE PICTURES COME FROM ──────────────────────────────────────────
 *
 * They are all LOCAL, in assets/images/. The page makes no third-party request
 * for media; the only external call left on the whole site is the YouTube
 * embed behind "Watch video", and that one is not made until someone presses
 * it.
 *
 * ⚠ THEY ARE STILL PLACEHOLDERS. Each was fetched once from Lorem Picsum
 * (picsum.photos), which serves photographs from Unsplash, and saved here so
 * the layout can be reviewed without calling out to anything. `seed` and
 * `credit` below record exactly which picture each one is, so any of them can
 * be traced or re-fetched. They are generic stock photographs of nothing in
 * particular — NOT Blink CMS screenshots, NOT client newsrooms, and NOT
 * cleared brand assets. Replace every one of them before launch.
 *
 * ⚠ AND THE VIDEOS DO NOT EXIST. There is no video to save, so `src` is
 * empty on both and the page never requests one: the poster image carries the
 * slot with a slow zoom. Drop a file in assets/video/, point `src` at it, and
 * it starts playing in view with no other change.
 */

/**
 * `src` is the file. `w`/`h` are written onto the <img> so the box is
 * reserved before the picture lands — this page budgets CLS under 0.05, and
 * an unsized image is the usual way to blow that.
 *
 * `seed` and `credit` are provenance, not plumbing. Delete them when the real
 * asset replaces the placeholder.
 */
export const images = {
  /* 07 · THE BEATS — one site screenshot per segment */
  beats_thanthi: {
    src: 'assets/images/beats-thanthi.jpg',
    w: 1600,
    h: 1000,
    seed: 'blink-beats-thanthi',
    credit: 'Lorem Picsum #949 (Unsplash) — placeholder',
  },
  beats_madhyamam: {
    src: 'assets/images/beats-madhyamam.jpg',
    w: 1600,
    h: 1000,
    seed: 'blink-beats-madhyamam',
    credit: 'Lorem Picsum #940 (Unsplash) — placeholder',
  },
  beats_bhaskar: {
    src: 'assets/images/beats-bhaskar.jpg',
    w: 1600,
    h: 1000,
    seed: 'blink-beats-bhaskar',
    credit: 'Lorem Picsum #705 (Unsplash) — placeholder',
  },
  beats_hansindia: {
    src: 'assets/images/beats-hansindia.jpg',
    w: 1600,
    h: 1000,
    seed: 'blink-beats-hansindia',
    credit: 'Lorem Picsum #809 (Unsplash) — placeholder',
  },
  beats_livelaw: {
    src: 'assets/images/beats-livelaw.jpg',
    w: 1600,
    h: 1000,
    seed: 'blink-beats-livelaw',
    credit: 'Lorem Picsum #76 (Unsplash) — placeholder',
  },
  beats_federal: {
    src: 'assets/images/beats-federal.jpg',
    w: 1600,
    h: 1000,
    seed: 'blink-beats-federal',
    credit: 'Lorem Picsum #950 (Unsplash) — placeholder',
  },

  /*
   * 08 · LETTERS — abstract newsroom frames, NOT portraits.
   * A stock photograph of a plausible-looking person beside a named quote
   * reads as that person. These stay abstract until real, approved
   * photographs arrive — and when they do, the names have to be real too.
   * See HANDOFF §7.
   */
  letters_1: {
    src: 'assets/images/letters-1.jpg',
    w: 900,
    h: 1200,
    seed: 'blink-newsroom-desk',
    credit: 'Lorem Picsum #701 (Unsplash) — placeholder',
  },
  letters_2: {
    src: 'assets/images/letters-2.jpg',
    w: 900,
    h: 1200,
    seed: 'blink-newsroom-press',
    credit: 'Lorem Picsum #121 (Unsplash) — placeholder',
  },
  /*
   * ⚠ letters-3.jpg and letters-4.jpg are currently byte-identical copies of
   * letters-2.jpg — same 78,730 bytes, same MD5 e666b960…. The third and
   * fourth letters therefore show the same picture as the second until two
   * distinct files are dropped in at these paths. Nothing else has to change
   * when they are.
   */
  letters_3: {
    src: 'assets/images/letters-3.jpg',
    w: 900,
    h: 1200,
    seed: 'blink-newsroom-3',
    credit: 'placeholder — currently a duplicate of letters-2.jpg',
  },
  letters_4: {
    src: 'assets/images/letters-4.jpg',
    w: 900,
    h: 1200,
    seed: 'blink-newsroom-4',
    credit: 'placeholder — currently a duplicate of letters-2.jpg',
  },

  /* 10 · THE WIRE */
  wire_1: {
    src: 'assets/images/wire-1.jpg',
    w: 1400,
    h: 900,
    seed: 'blink-wire-tamil-daily',
    credit: 'Lorem Picsum #145 (Unsplash) — placeholder',
  },
  wire_2: {
    src: 'assets/images/wire-2.jpg',
    w: 900,
    h: 700,
    seed: 'blink-wire-ai-editor',
    credit: 'Lorem Picsum #299 (Unsplash) — placeholder',
  },
  wire_3: {
    src: 'assets/images/wire-3.jpg',
    w: 900,
    h: 700,
    seed: 'blink-wire-wordpress-seo',
    credit: 'Lorem Picsum #946 (Unsplash) — placeholder',
  },
}

/**
 * `src` empty → the poster carries the slot and no video is ever requested.
 * There is no video file to ship yet; the posters below are real and local.
 */
export const videos = {
  live_video: {
    src: '',
    poster: {
      src: 'assets/images/poster-live-newsroom.jpg',
      w: 1920,
      h: 1080,
      seed: 'blink-live-newsroom',
      credit: 'Lorem Picsum #694 (Unsplash) — placeholder',
    },
  },
  cta_video: {
    src: 'assets/videos/cta-bg.mp4',
    poster: {
      src: 'assets/images/poster-cta-press.jpg',
      w: 1920,
      h: 1080,
      seed: 'blink-cta-press',
      credit: 'Lorem Picsum #290 (Unsplash) — placeholder',
    },
  },
}

/**
 * 01's two marquees, and 12's orbiting chips. `src` takes a white monochrome
 * SVG; until there is one, the publisher's name is set as type, which is what
 * the page shows today.
 */
export const logos = [
  { name: 'Daily Thanthi', src: '' },
  { name: 'The Hans India', src: '' },
  { name: 'LiveLaw', src: '' },
  { name: 'The Federal', src: '' },
  { name: 'Madhyamam', src: '' },
  { name: 'TV5 Telugu', src: '' },
  { name: 'Deccan Chronicle', src: '' },
  { name: 'The Asian Age', src: '' },
  { name: 'MediaOne', src: '' },
  { name: 'Maalaimalar', src: '' },
  { name: 'Bhaskar Hindi', src: '' },
  { name: 'The Assam Tribune', src: '' },
  { name: 'Millennium Post', src: '' },
  { name: 'Medical Dialogues', src: '' },
  { name: 'Tupaki', src: '' },
  { name: 'BOOM', src: '' },
]

/** The file for an image key. */
export function imageSrc(key) {
  return images[key]?.src || ''
}

/** `{ w, h }` for an image key, so the markup can reserve the box. */
export function imageSize(key) {
  const m = images[key]
  return m ? { w: m.w, h: m.h } : { w: 16, h: 10 }
}

/** A video's poster — always present, even when the video is not. */
export function posterSrc(key) {
  return videos[key]?.poster?.src || ''
}

/** The video file itself, or '' when there is not one yet. */
export function videoSrc(key) {
  return videos[key]?.src || ''
}
