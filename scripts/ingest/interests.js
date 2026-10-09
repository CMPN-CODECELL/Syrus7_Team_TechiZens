// Picks the app's interests (INTEREST_OPTIONS) that a piece of text points to, using the same
// keyword list the relevance score uses, so scraped opportunities and the score agree.

import { INTEREST_KEYWORDS, hasWord } from "../../src/lib/scoring.js"

export function inferInterests(text) {
  return Object.entries(INTEREST_KEYWORDS)
    .filter(([, words]) => words.some((word) => hasWord(text, word)))
    .map(([interest]) => interest)
}
