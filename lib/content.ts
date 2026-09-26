/**
 * Blink CMS — single source of copy.
 * Rule: only facts supplied in the brief. Anything not supplied is marked PLACEHOLDER.
 * Headlines live here as live HTML text (never baked into images).
 */

export const PLACEHOLDER = (label: string) => '[' + label.toUpperCase() + ']'

/* ── 00 · PRELOADER ───────────────────────────────────────────── */

/** Sample wire lines. Clearly sample text — not real filed copy. */
export const wireFeed = [
  { time: '14:32', bureau: 'CHENNAI', text: 'ELECTION COUNT BEGINS' },
  { time: '14:33', bureau: 'KOCHI', text: 'MONSOON ALERT ISSUED' },
  { time: '14:33', bureau: 'DELHI', text: 'MARKETS OPEN HIGHER' },
  { time: '14:34', bureau: 'HYDERABAD', text: 'CIVIC POLL DATES ANNOUNCED' },
  { time: '14:35', bureau: 'GUWAHATI', text: 'RIVER LEVELS UNDER WATCH' },
  { time: '14:36', bureau: 'BHOPAL', text: 'BUDGET SESSION EXTENDED' },
  { time: '14:36', bureau: 'KOZHIKODE', text: 'PORT TRAFFIC RESUMES' },
] as const

export const languages = [
  'TAMIL',
  'TELUGU',
  'HINDI',
  'MALAYALAM',
  'ENGLISH',
  'ASSAMESE',
] as const

/** Bureau cities — lat/lon shared by the flat halftone map and the 3D globe. */
export const bureaus = [
  { city: 'NOIDA', label: 'NOIDA / DELHI', lat: 28.5355, lon: 77.391, hq: true },
  { city: 'CHENNAI', label: 'CHENNAI', lat: 13.0827, lon: 80.2707, hq: false },
  { city: 'HYDERABAD', label: 'HYDERABAD', lat: 17.385, lon: 78.4867, hq: false },
  { city: 'KOCHI', label: 'KOCHI', lat: 9.9312, lon: 76.2673, hq: false },
  { city: 'KOZHIKODE', label: 'KOZHIKODE', lat: 11.2588, lon: 75.7804, hq: false },
  { city: 'GUWAHATI', label: 'GUWAHATI', lat: 26.1445, lon: 91.7362, hq: false },
  { city: 'BHOPAL', label: 'BHOPAL', lat: 23.2599, lon: 77.4126, hq: false },
]

export const dateline = 'NOIDA, 26 SEP 2026 — 14:32 IST'

/* ── GLOBAL UI ────────────────────────────────────────────────── */

export const tickerItems = [
  '150+ NEWSROOMS',
  '43K CONCURRENT READERS',
  'ZERO DOWNTIME',
  '20+ FACT-CHECK SITES',
]

export const footerTickerItems = [
  'NATIONAL DAILIES',
  'REGIONAL & LANGUAGE NEWS',
  'DIGITAL-FIRST MEDIA',
  'FACT-CHECKERS',
  'LEGAL NEWS',
  'HEALTH NEWS',
  'SPORTS',
]

export const nav = ['PLATFORM', 'MODULES', 'CASE STUDIES', 'THE WIRE', 'FAQ', 'CONTACT']

/* ── 01 · HERO ────────────────────────────────────────────────── */

export const hero = {
  eyebrow: 'ONE PLATFORM',
  h1: ['EVERY STAGE', 'OF THE STORY'],
  sub: 'Monitor, gather, create, publish, monetize and analyze, all in one newsroom platform.',
  primary: 'Book a demo',
  secondary: 'Watch the film',
}

/** Headline tags that pop off the globe pings. Sample tags, not real stories. */
export const pings = [
  { kind: 'LIVE', city: 'CHENNAI' },
  { kind: 'BREAKING', city: 'KOCHI' },
  { kind: 'UPDATE', city: 'DELHI' },
  { kind: 'EXCLUSIVE', city: 'GUWAHATI' },
]

/* ── 02 · FRONT PAGE ──────────────────────────────────────────── */

export const frontPage = {
  masthead: 'THE BLINK TIMES · VOL. 150+ · NEWSROOM EDITION',
  headline: { grey: 'WE BUILD NEWSROOMS.', ink: 'WE OWN THE UPTIME.' },
  body: 'One platform, one accountable team. No plugin patchwork, no vendor ping-pong, just your extended tech team from first draft to final click.',
  cta: 'ABOUT BLINK',
  statsCaption: 'FROM MILLIONS OF STORIES, CLARITY EMERGES',
  stats: [
    { value: 150, suffix: '+', label: 'newsrooms powered' },
    { value: 43, suffix: 'K', label: 'concurrent readers, zero downtime' },
    { value: 20, suffix: '+', label: 'fact-checking sites' },
    { value: 400, suffix: '%', label: 'faster page loads' },
  ],
}

/* ── 03 · THE DESK ────────────────────────────────────────────── */

export const desk = {
  label: 'CREATE · THE HEADLINE IS WRITTEN',
  typed: 'EVERY STAGE OF THE STORY',
}

/* ── 04 · OUR PLATFORM ────────────────────────────────────────── */

export const platform = {
  bigWord: 'OUR PLATFORM',
  strap: 'Everything your newsroom needs. Under one platform.',
  modules: [
    { title: 'THE REPORTER', icon: 'mic', line: 'Stringer app, assignments, offline filing, payments.' },
    { title: 'THE AI EDITOR', icon: 'pen', line: 'Auto-tagging, story suggestions, full AI drafts.' },
    { title: 'THE EDITION', icon: 'phone', line: 'Web, AMP, PWA, Android & iOS.' },
    { title: 'THE SUBSCRIBER', icon: 'lock', line: 'Time, dynamic & hard paywalls, coupons, gift plans.' },
    { title: 'THE E-PAPER', icon: 'newspaper', line: 'Hosting, clip & share, edition management.' },
    { title: 'THE ANALYST', icon: 'chart', line: 'Real-time analytics, GA4, H-SEO score.' },
  ],
}

/* ── 05 · LIVE ────────────────────────────────────────────────── */

export const live = {
  headline: { grey: 'RELIABILITY', ink: 'ON EVERY DEADLINE' },
  body: "Breaking news doesn't wait, and neither does your platform.",
  features: [
    {
      title: 'AUTO-SCALING CLOUD',
      icon: 'bolt',
      line: 'Traffic spikes scale automatically on AWS. Zero downtime at 43K concurrent readers.',
    },
    {
      title: 'REAL-TIME DESK VISIBILITY',
      icon: 'ticker',
      line: 'Dashboards, story checkpoints and TAT tracking for every desk.',
    },
    {
      title: 'WEBMASTER SUPPORT',
      icon: 'shield',
      line: 'Monitoring, fixes and Google News setup, handled for you.',
    },
  ],
  /** Timestamp ticks down the live-blog strip. Sample timeline. */
  ticks: ['14:32', '14:35', '14:41', '14:46', '14:52', '15:04', '15:11', '15:19'],
  storyCard: 'DESK HOLDS AT FULL LOAD',
}

/* ── 06 · THE PRESS ───────────────────────────────────────────── */

export const press = {
  headline: ['A NEWSROOM THAT', 'WORKS AS HARD', 'AS YOU DO'],
  features: [
    { title: 'ONE PLATFORM, NOT FIVE VENDORS', icon: 'globe', line: 'CMS, apps, paywall, ads and analytics under one roof.', pos: 'left' },
    { title: 'FULL NEWSROOM VISIBILITY', icon: 'camera', line: 'Every story tracked from assignment to publish.', pos: 'left' },
    { title: 'SEO YOU CAN TRUST', icon: 'satellite', line: 'H-SEO score, schemas, AMP and Google News built in.', pos: 'right' },
    { title: 'PAY FOR FEATURES, NOT TRAFFIC', icon: 'chart', line: 'Grow your audience without growing your bill.', pos: 'right' },
    { title: 'FASTER PAGES', icon: 'bolt', line: 'Daily Thanthi loads in 1.5s.', pos: 'bottom' },
  ],
}

/* ── 07 · LETTERS ─────────────────────────────────────────────── */

export const letters = {
  headline: [
    { text: 'TRUSTED', tone: 'ink' },
    { text: 'BY NEWSROOMS', tone: 'ink' },
    { text: 'ACROSS INDIA', tone: 'grey' },
  ],
  intro:
    'From regional dailies to national networks, publishers stay because we treat their newsroom like our own.',
  byline: 'BY THE BLINK DESK · NOIDA',
  /** Results only — no quotes, no named people. Nothing here is invented. */
  clippings: [
    {
      publication: 'DAILY THANTHI',
      segment: 'TAMIL DAILY',
      results: [
        { metric: '20×', label: 'growth' },
        { metric: '1.5s', label: 'load time' },
        { metric: '83%', label: 'search discovery' },
      ],
    },
    {
      publication: 'THE HANS INDIA',
      segment: 'ENGLISH DAILY',
      results: [
        { metric: '2 MO', label: 'to record traffic' },
        { metric: '43K', label: 'concurrent users' },
        { metric: 'ZERO', label: 'downtime' },
      ],
    },
    {
      publication: 'LIVELAW',
      segment: 'LEGAL NEWS',
      results: [
        { metric: '−30%', label: 'bounce rate' },
        { metric: '10s', label: 'faster pages' },
      ],
    },
    {
      publication: 'THE FEDERAL',
      segment: 'DIGITAL-FIRST',
      results: [
        { metric: '2×', label: 'traffic in 8 months' },
        { metric: '93ms', label: 'INP' },
      ],
    },
    {
      publication: 'MADHYAMAM',
      segment: 'MALAYALAM DAILY',
      results: [
        { metric: '+50%', label: 'engagement' },
        { metric: '72%', label: 'search discovery' },
      ],
    },
  ],
}

/* ── 08 · MASTHEAD WALL ───────────────────────────────────────── */

export const publishers = [
  'TV5 TELUGU', 'DAILY THANTHI', 'TUPAKI', 'MAALAIMALAR', 'BHASKAR HINDI',
  'MEDIAONE', 'LIVELAW', 'THE ASIAN AGE', 'THE BRIDGE', 'RANI',
  'MADHYAMAM', 'MEDICAL DIALOGUES', 'DECCAN CHRONICLE', 'CORE', 'BOOM',
  'THE FEDERAL', 'THE HANS INDIA', 'TELUGU GLOBE', 'THE ASSAM TRIBUNE', 'MILLENNIUM POST',
]

export const integrations = [
  'GOOGLE NEWS', 'AMP', 'GA4', 'GOOGLE MCM / DFP', 'FACEBOOK PIXEL',
  'CHATGPT', 'AWS', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN', 'X',
]

/* ── 09 · THE WIRE ────────────────────────────────────────────── */

export const wire = {
  headline: ["WHAT'S MOVING", 'IN NEWSROOM TECH'],
  cta: 'VIEW ALL',
  rows: [
    { date: '26 SEP 2026', kind: 'CASE STUDY', title: 'How a Tamil daily grew 20× on Blink CMS', tag: 'GROWTH', isNew: true },
    { date: '19 SEP 2026', kind: 'PRODUCT', title: 'AI story creation, now in the editor', tag: 'PRODUCT', isNew: false },
    { date: '11 SEP 2026', kind: 'GUIDE', title: 'Leaving WordPress without losing SEO', tag: 'MIGRATION', isNew: false },
    { date: '02 SEP 2026', kind: 'ELECTIONS', title: 'Running a live results desk at scale', tag: 'LIVE DESK', isNew: false },
    { date: '—', kind: 'SLOT', title: PLACEHOLDER('article slot 05'), tag: 'TBD', isNew: false },
    { date: '—', kind: 'SLOT', title: PLACEHOLDER('article slot 06'), tag: 'TBD', isNew: false },
  ],
}

/* ── 10 · F.A.Q ───────────────────────────────────────────────── */

export const faq = {
  intro: 'Straight answers, so your newsroom can move forward.',
  asideTitle: 'Still have questions?',
  asideCta: 'EMAIL THE DESK',
  items: [
    { q: 'What does Blink CMS do?', a: PLACEHOLDER('answer — brief supplies the question only') },
    { q: 'Which publishers do you work with?', a: PLACEHOLDER('answer — the supplied publisher list is on the masthead wall above') },
    { q: 'Can we migrate from WordPress without losing SEO?', a: PLACEHOLDER('answer') },
    { q: 'Will the site survive a traffic spike?', a: PLACEHOLDER('answer') },
    { q: 'Do you charge more as traffic grows?', a: 'No. Billing is by features.' },
    { q: 'Do you have a reporter / stringer app?', a: PLACEHOLDER('answer') },
    { q: 'Can you build custom modules (elections, cricket, classifieds)?', a: PLACEHOLDER('answer') },
    { q: 'How do we get a demo?', a: PLACEHOLDER('answer') },
  ],
}

/* ── 11 · ON AIR ──────────────────────────────────────────────── */

export const onAir = {
  headline: ['READY TO', 'GO LIVE?'],
  sub: 'The extended tech team behind 150+ newsrooms. No ticket queues. No runaround. Just people who know news.',
  cta: 'BOOK A DEMO',
}

/* ── 12 · FOOTER ──────────────────────────────────────────────── */

export const footer = {
  tagline: 'Every stage of the story.',
  nav: [
    { heading: 'PLATFORM', links: ['Monitor', 'Gather', 'Create', 'Publish', 'Monetize', 'Analyze'] },
    { heading: 'MODULES', links: ['The Reporter', 'The AI Editor', 'The Edition', 'The Subscriber', 'The E-Paper', 'The Analyst'] },
    { heading: 'CASE STUDIES', links: ['Daily Thanthi', 'The Hans India', 'LiveLaw', 'The Federal', 'Madhyamam'] },
    { heading: 'THE WIRE', links: ['Case Studies', 'Product', 'Guides', 'Elections'] },
    { heading: 'CAREERS', links: ['Open roles', 'Engineering', 'Newsroom support'] },
    { heading: 'CONTACT', links: ['Book a demo', 'Email the desk', 'Support'] },
  ],
  socials: ['X', 'IN', 'FB', 'YT'],
  office: {
    heading: 'HEAD OFFICE',
    address:
      '1st Floor, Rally Infra, H-157, near Noida Electronic City Metro, H Block, Sector 63, Noida, UP 201301',
    email: PLACEHOLDER('email'),
    phone: PLACEHOLDER('phone'),
  },
  legal: '© 2026 Blink CMS · Printed digitally in Noida',
  legalLinks: ['Privacy', 'Terms', 'Cookies'],
}
