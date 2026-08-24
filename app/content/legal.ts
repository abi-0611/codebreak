/**
 * `/privacy`, `/terms`, and the 404. Phase 7, routes 6, 7 and 8.
 *
 * Real, plausible, boring legal copy set in the `.txt` long-form block from
 * teardown §5. NO TERM AND NO DECOY LIVES ON EITHER LEGAL ROUTE. A reader who
 * works through a privacy notice looking for something deserves not to be
 * punished for it, and a reader who works through one and finds a plant learns
 * that the whole site is a plant.
 *
 * The copy is short because the site is short: it is static, it sets no
 * cookies, it runs no analytics and it loads nothing from a third party. Most
 * of what a privacy notice normally has to say does not apply, and saying so
 * plainly is both true and more convincing than three thousand words of
 * boilerplate about a site that does none of it.
 */
import { mailbox, credits, site } from '~/content/site'

export type Clause = {
  readonly heading: string
  readonly body: readonly string[]
  /** Rendered as the `.txt` list — hairline rows with a bullet. */
  readonly list?: readonly string[]
}

export type Notice = {
  readonly title: string
  readonly updated: string
  readonly lede: string
  readonly clauses: readonly Clause[]
  readonly meta: { readonly title: string; readonly describe: string; readonly path: string }
}

/* -------------------------------------------------------------------------- */
/* privacy                                                                    */
/* -------------------------------------------------------------------------- */

export const privacy: Notice = {
  title: 'Privacy',
  updated: 'Last amended 12 January 2026',
  lede:
    'This site collects nothing about you. What follows says so in the detail ' +
    'the law asks for, and covers the one case where the house does hold your ' +
    'details: when you have written to it.',
  clauses: [
    {
      heading: 'What this site does',
      body: [
        'crocaria.com is a static site. Every page is built in advance and ' +
        'served as a file. There is no account, no basket, no form and no ' +
        'server that receives anything you do here.',
        'It sets no cookies of any kind, including the ones a site is allowed ' +
        'to set without asking. There is no analytics package, no tag manager, ' +
        'no pixel, no session recorder and no advertising network. This is why ' +
        'you have not been shown a consent banner: there is nothing to consent ' +
        'to, and a banner asking you to agree to nothing would be theatre.',
      ],
    },
    {
      heading: 'What is loaded from elsewhere',
      body: [
        'One thing. The three typefaces the site is set in are served by Google ' +
        'Fonts, which receives the request for the font files themselves. ' +
        'Everything else — every image, every script, every stylesheet — is ' +
        'served from the same place as the page.',
      ],
    },
    {
      heading: 'What the house keeps',
      body: [
        'If you write to the ledger desk, the house holds your message and your ' +
        'address for as long as the matter is open and for six years after it ' +
        'closes, which is the period Spanish commercial law requires of a ' +
        'bonded house. Nothing is passed to anyone else and nothing is used to ' +
        'market anything to you.',
        'Lot correspondence is filed against the lot number, because that is ' +
        'how a register works. A buyer who asks the house to forget a lot is ' +
        'asking it to break the chain the lot is sold on, and the house will ' +
        'say no to that and explain why.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'Under the General Data Protection Regulation and the Spanish data ' +
        'protection act you may ask the house for a copy of what it holds about ' +
        'you, ask it to correct anything wrong, and ask it to delete anything ' +
        'it is not required to keep. Write to the address below. The house ' +
        'replies inside a month and does not charge for it.',
        'If the reply does not satisfy you, the Agencia Española de Protección ' +
        'de Datos takes complaints directly.',
      ],
    },
    {
      heading: 'Who to write to',
      body: [
        `Crocaria S.L., Consuegra, Toledo. ${mailbox}.`,
        'The house has no data protection officer because it is not large ' +
        'enough to need one. The person who reads the ledger desk mail is the ' +
        'person who handles this.',
      ],
    },
  ],
  meta: {
    title: 'Privacy',
    describe:
      'What Crocaria collects on this site — which is nothing — and what the ' +
      'house holds when you have written to the ledger desk.',
    path: '/privacy',
  },
}

/* -------------------------------------------------------------------------- */
/* terms                                                                      */
/* -------------------------------------------------------------------------- */

export const terms: Notice = {
  title: 'Terms',
  updated: 'Last amended 12 January 2026',
  lede:
    'The terms this site is published under. They are not the terms a lot is ' +
    'sold under — those are on the contract note, and the contract note wins ' +
    'wherever the two differ.',
  clauses: [
    {
      heading: 'Who publishes this',
      body: [
        `${site.name} is the trading name of Crocaria S.L., registered at ` +
        'Consuegra, Toledo, and entered in the Registro Mercantil de Toledo. ' +
        `${credits.house}.`,
      ],
    },
    {
      heading: 'What you may do with it',
      body: [
        'Read it, print it, quote it, and link to it. The house would rather be ' +
        'quoted than paraphrased and does not ask to be asked first.',
      ],
      list: [
        'The mark and the wordmark may be reproduced to identify the house. The terms are in the file on the house page and they are short.',
        'Neither may be redrawn, recoloured, stretched, outlined or locked up with a second mark.',
        'The photographs, the engravings and the written matter on this site stay the property of the house.',
      ],
    },
    {
      heading: 'The register',
      body: [
        'The lot register on this site is published as a convenience and is ' +
        'current to the week it says it is current to. It is not an offer, it ' +
        'is not a price list, and a lot appearing on it is not a promise that ' +
        'the lot is unsold.',
        'A figure on this site does not bind the house. The figure that binds ' +
        'the house is the one struck on the certificate that travels with the ' +
        'lot, and where the two differ the certificate is right.',
      ],
    },
    {
      heading: 'What the house does not promise',
      body: [
        'This site is published as it is, with no warranty of any kind, stated ' +
        'or implied. The house takes reasonable care over what it puts here and ' +
        'does not undertake that every figure on every page is free of error.',
        'The house is not liable for anything you lose by acting on this site ' +
        'rather than on a contract note. Nothing here limits liability for ' +
        'death, personal injury or fraud, which cannot be limited and which the ' +
        'house would not want to limit.',
      ],
    },
    {
      heading: 'Links out',
      body: [
        'Where this site points somewhere else, the house has read what is ' +
        'there on the day it linked to it and has no control over it after ' +
        'that. A link is not an endorsement of anything beyond the page it ' +
        'points at.',
      ],
    },
    {
      heading: 'Governing law',
      body: [
        'These terms are governed by Spanish law. The courts of Toledo have ' +
        'jurisdiction, and nothing in this clause takes away a consumer’s right ' +
        'to bring a matter in the courts of the place they live.',
      ],
    },
  ],
  meta: {
    title: 'Terms',
    describe:
      'The terms the Crocaria site is published under, what may be done with ' +
      'the house mark, and what a figure on this site does and does not bind.',
    path: '/terms',
  },
}

/* -------------------------------------------------------------------------- */
/* the 404                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Route 8. The reference does not define one; a site that publishes a register
 * of numbered lots needs one more than most, because a reader who mistypes a
 * lot number will find it.
 *
 * One line, in the house voice, and one pill back. No wit, no illustration, no
 * apology — the house does not perform embarrassment.
 */
export const lost = {
  code: '404',
  heading: 'Nothing is filed here',
  body:
    'The register is kept by number, and this is not one of them. If you came ' +
    'looking for a lot, the ledger desk will read it back to you against a ' +
    'certificate.',
  actions: [
    { label: 'The Ledger', to: '/ledger' },
    { label: 'Write to the desk', href: `mailto:${mailbox}` },
  ],
} as const

/**
 * The other error the site can produce — a route that resolved and then threw.
 * Same band, a different line, because telling a reader a page does not exist
 * when it does is worse than saying nothing useful.
 */
export const broke = {
  code: 'Fault',
  heading: 'The desk is not responding',
  body:
    'Something on the house side failed while this page was being served. ' +
    'Nothing here records it, so the house will not know unless you say so.',
} as const
