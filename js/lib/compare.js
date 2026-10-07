/**
 * 06 · HEAD TO HEAD — the comparison rows.
 *
 * SOURCE: the Blink CMS feature comparison, as supplied. Every row says the
 * same thing — "WordPress out of the box does not ship this; Blink CMS does" —
 * which is a statement about what is in each box rather than a judgement of
 * either product, and the note under the table says plainly what WordPress
 * does offer so the comparison cannot be read as the whole story.
 *
 * Nothing here is inferred. If a row is not in the client's comparison
 * document it is not in this file.
 */

export const compare = {
  newsroom: {
    label: 'Newsroom',
    rows: [
      'Newsroom-focused CMS',
      'Custom workflow management',
      'Approval workflows',
      'Reporter / stringer app',
      'Bureau & team structures',
    ],
  },
  ai: {
    label: 'AI',
    rows: [
      'AI auto-tagging & categorisation',
      'AI story suggestions',
      'AI full story creation',
      'ChatGPT editor assistance',
      'AI web stories',
    ],
  },
  dist: {
    label: 'Distribution',
    rows: [
      'Headless CMS',
      'Auto social distribution',
      'Android & iOS apps',
      'Configurable homepage blocks',
      'Multiple story formats',
    ],
  },
  revenue: {
    label: 'Revenue',
    rows: [
      'Time, dynamic & hard paywalls',
      'In-app purchases',
      'Gift, IP & bulk subscriptions',
      'Coupon system',
      'Google MCM partnership',
    ],
  },
  modules: {
    label: 'Modules',
    rows: [
      'E-paper editions',
      'Election module',
      'Cricket scorecards',
      'Olympics module',
      'Classifieds & obituaries',
    ],
  },
}
