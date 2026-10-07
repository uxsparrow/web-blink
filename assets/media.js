/**
 * Every image, video and logo on the page, in one place.
 *
 * The point of this file: nothing in the markup hard-codes a path. When the
 * real assets arrive, set `src` on the entry and nothing else changes —
 * no hunting through index.html, no second place to forget.
 *
 * Until then every image falls back to a deterministic dummy from
 * picsum.photos, seeded per key so a given slot always gets the same picture
 * and the layout does not reshuffle between reloads.
 *
 *   ⚠ picsum.photos is an external service, and it is the only one the page
 *   calls apart from the YouTube embed behind "Watch video". It exists so the
 *   client can see the layout with pictures in it before supplying any. The
 *   moment every `src` below is filled in, the page makes no third-party
 *   requests at all — which is the state it should ship in.
 *
 * Videos degrade further: `src` empty means the <video> is never given a
 * source and the poster image carries the slot with a slow zoom. A missing
 * video file is not an error, it is a still.
 */

const DUMMY = 'https://picsum.photos/seed'

/**
 * `src` wins when set. `seed` + `w`/`h` build the stand-in when it is not.
 * `w`/`h` are also written onto the <img> so the box is reserved before the
 * picture lands — this page budgets CLS at under 0.05 and an unsized image is
 * the usual way to blow that.
 */
export const images = {
  /* 07 · THE BEATS — one site screenshot per segment */
  beats_thanthi: { src: '', seed: 'blink-beats-thanthi', w: 1600, h: 1000 },
  beats_madhyamam: { src: '', seed: 'blink-beats-madhyamam', w: 1600, h: 1000 },
  beats_bhaskar: { src: '', seed: 'blink-beats-bhaskar', w: 1600, h: 1000 },
  beats_hansindia: { src: '', seed: 'blink-beats-hansindia', w: 1600, h: 1000 },
  beats_livelaw: { src: '', seed: 'blink-beats-livelaw', w: 1600, h: 1000 },
  beats_federal: { src: '', seed: 'blink-beats-federal', w: 1600, h: 1000 },

  /*
   * 08 · LETTERS — abstract newsroom frames, NOT portraits.
   * A stock photograph of a plausible-looking person beside a named quote
   * reads as that person. These seeds stay abstract until real, approved
   * photographs arrive; see HANDOFF §7.
   */
  letters_1: { src: '', seed: 'blink-newsroom-desk', w: 900, h: 1200 },
  letters_2: { src: '', seed: 'blink-newsroom-press', w: 900, h: 1200 },

  /* 10 · THE WIRE */
  wire_1: { src: '', seed: 'blink-wire-tamil-daily', w: 1400, h: 900 },
  wire_2: { src: '', seed: 'blink-wire-ai-editor', w: 900, h: 700 },
  wire_3: { src: '', seed: 'blink-wire-wordpress-seo', w: 900, h: 700 },
}

/**
 * `src` empty → the poster carries the slot and no video is ever requested.
 * The poster falls back to a dummy like any other image.
 */
export const videos = {
  live_video: {
    src: '',
    poster: { src: '', seed: 'blink-live-newsroom', w: 1920, h: 1080 },
  },
  cta_video: {
    src: '',
    poster: { src: '', seed: 'blink-cta-press', w: 1920, h: 1080 },
  },
}

/**
 * 01's two marquees. `src` takes a white monochrome SVG; until then the
 * publisher's name is set as type, which is what the page shows today.
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

/** The URL for an image key, real or dummy. */
export function imageSrc(key) {
  const m = images[key]
  if (!m) return ''
  return m.src || `${DUMMY}/${m.seed}/${m.w}/${m.h}`
}

/** `{ w, h }` for an image key, so the markup can reserve the box. */
export function imageSize(key) {
  const m = images[key]
  return m ? { w: m.w, h: m.h } : { w: 16, h: 10 }
}

/** The URL for a video's poster, real or dummy. */
export function posterSrc(key) {
  const v = videos[key]
  if (!v) return ''
  const p = v.poster
  return p.src || `${DUMMY}/${p.seed}/${p.w}/${p.h}`
}

/** The video file itself, or '' when the client has not supplied one yet. */
export function videoSrc(key) {
  return videos[key]?.src || ''
}
