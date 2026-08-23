/**
 * House constants. Every user-visible string on the site starts life in
 * app/content/ and arrives at a section as a prop — never inline in a template.
 */
export const site = {
  name: 'CROCARIA',
  founded: 1904,
  place: 'Consuegra',
  tagline: 'Grown, graded, sealed.',
  home: '/',
} as const

export type Site = typeof site
