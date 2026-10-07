/**
 * The only copy that lives in JavaScript. Everything else is written straight
 * into index.html, so the page reads correctly with no scripts running.
 * These are the values the scenes need at runtime.
 */

/** Bureau cities, shared by the globe. */
export const bureaus = [
  { city: 'NOIDA', label: 'NOIDA / DELHI', lat: 28.5355, lon: 77.391, hq: true },
  { city: 'CHENNAI', label: 'CHENNAI', lat: 13.0827, lon: 80.2707, hq: false },
  { city: 'HYDERABAD', label: 'HYDERABAD', lat: 17.385, lon: 78.4867, hq: false },
  { city: 'KOCHI', label: 'KOCHI', lat: 9.9312, lon: 76.2673, hq: false },
  { city: 'KOZHIKODE', label: 'KOZHIKODE', lat: 11.2588, lon: 75.7804, hq: false },
  { city: 'GUWAHATI', label: 'GUWAHATI', lat: 26.1445, lon: 91.7362, hq: false },
  { city: 'BHOPAL', label: 'BHOPAL', lat: 23.2599, lon: 77.4126, hq: false },
]


/**
 * Pings on the globe, all arcing back to the Noida desk. Sample markers, not
 * real stories.
 *
 * The four Indian bureau cities flare red and carry a headline tag — they are
 * the ones the brief names. Everything else is wire traffic from outside
 * India: violet, smaller, no tag, and no claim of an office there.
 */
export const pings = [
  // the four the brief names — red flare, full headline tag
  { kind: 'LIVE', city: 'CHENNAI', lat: 13.0827, lon: 80.2707, tag: true, bureau: true },
  { kind: 'BREAKING', city: 'KOCHI', lat: 9.9312, lon: 76.2673, tag: true, bureau: true },
  { kind: 'UPDATE', city: 'DELHI', lat: 28.6139, lon: 77.209, tag: true, bureau: true },
  { kind: 'EXCLUSIVE', city: 'GUWAHATI', lat: 26.1445, lon: 91.7362, tag: true, bureau: true },

  // the brief's remaining bureaus — red flare, city label
  { city: 'HYDERABAD', lat: 17.385, lon: 78.4867, bureau: true },
  { city: 'KOZHIKODE', lat: 11.2588, lon: 75.7804, bureau: true },
  { city: 'BHOPAL', lat: 23.2599, lon: 77.4126, bureau: true },

  // other Indian datelines on the wire
  { city: 'MUMBAI', lat: 19.076, lon: 72.8777 },
  { city: 'KOLKATA', lat: 22.5726, lon: 88.3639 },

  // near neighbours — visible alongside India
  { city: 'COLOMBO', lat: 6.9271, lon: 79.8612 },
  { city: 'DHAKA', lat: 23.8103, lon: 90.4125 },
  { city: 'KATHMANDU', lat: 27.7172, lon: 85.324 },
  { city: 'DUBAI', lat: 25.2048, lon: 55.2708 },

  // the wider wire
  { city: 'SINGAPORE', lat: 1.3521, lon: 103.8198 },
  { city: 'TOKYO', lat: 35.6762, lon: 139.6503 },
  { city: 'SYDNEY', lat: -33.8688, lon: 151.2093 },
  { city: 'NAIROBI', lat: -1.2921, lon: 36.8219 },
  { city: 'JOHANNESBURG', lat: -26.2041, lon: 28.0473 },
  { city: 'FRANKFURT', lat: 50.1109, lon: 8.6821 },
  { city: 'LONDON', lat: 51.5074, lon: -0.1278 },
  { city: 'NEW YORK', lat: 40.7128, lon: -74.006 },
  { city: 'TORONTO', lat: 43.6532, lon: -79.3832 },
  { city: 'SAO PAULO', lat: -23.5505, lon: -46.6333 },
]

/** Longitude parked in front of the camera when the globe first appears. */
export const START_LON = 78


/**
 * 08 · LETTERS. The only section whose copy is not in index.html, because a
 * carousel showing one item at a time has nowhere to put the others: the
 * first letter is in the markup and reads fine with no scripts, and these are
 * what the arrows page through.
 *
 * ⚠ MIXED PROVENANCE — read `source` on every entry before this ships.
 *
 * `source: 'sample'` means the name, the role and the words are invented. Two
 * of these are, at the user's request, for an internal review build. A
 * fabricated quote beside a real customer's masthead reads as an endorsement
 * that customer never gave, so those two have to be replaced or flagged before
 * the page is public — see HANDOFF §6d.
 *
 * `source: <url>` means the quote is verbatim from that published case study,
 * not paraphrased and not shortened. If one ever has to be cut, mark the cut:
 * the section claims nothing is paraphrased.
 *
 * Two more verbatim ones exist and are not used here — Hari Bhoomi's digital
 * team and EVO India's team, from the same `/case-study/` set. They are in
 * HANDOFF §6d and can replace the two samples without any other change.
 *
 * `shot` is one frame per letter now. They are frames and never faces on
 * purpose: a stock photograph of a plausible-looking person beside a named
 * quote reads as that person. ⚠ letters_3 and letters_4 are byte-identical
 * copies of letters_2 at the moment, so three of the four show the same
 * picture — see the note beside them in assets/media.js.
 */
export const letters = [
  {
    text:
      'Our reporters file from the district in Tamil, on their phones, and it reaches the front page without anyone retyping it.',
    name: 'Karthik Subramanian',
    role: 'Executive Editor',
    org: 'Daily Thanthi',
    shot: 'letters_1',
    source: 'sample',
  },
  {
    text:
      'Election night, we watched the traffic climb and did nothing at all, which is exactly what we were paying for.',
    name: 'Siddharth Menon',
    role: 'Head of Digital Product',
    org: 'The Federal',
    shot: 'letters_2',
    source: 'sample',
  },
  {
    text:
      'The platform’s stability has been remarkable, and we’ve seen a significant increase in readership and revenue since the switch.',
    name: 'Adv Rohan Verma',
    role: 'Co-founder & Legal Editor',
    org: 'LiveLaw',
    shot: 'letters_3',
    source: 'blinkcms.ai /case-study/ — LiveLaw, verbatim',
  },
  {
    text:
      'After partnering with Blink CMS, we saw immediate improvements in traffic, search visibility, and overall site speed.',
    name: 'Pradeep Reddy',
    role: 'Chief Digital Officer',
    org: 'Deccan Chronicle',
    shot: 'letters_4',
    source: 'blinkcms.ai /case-study/ — Deccan Chronicle, verbatim',
  },
]
