# Daily quote sources

LiangOS ships its quote calendar locally. It does not call a random quote API at
runtime, so the sentence stays fixed for the full local day and remains available
when the network is unavailable.

- Curated LiangOS seed quotes: 24 short attributed quotations.
- `《幽梦影》` and selected classical poetry: generated from the MIT-licensed
  [`chinese-poetry/chinese-poetry`](https://github.com/chinese-poetry/chinese-poetry)
  dataset at commit `b8594f81a89752241442f2ce267d6f66f96704ee`.
- Corpus verification date: `2026-08-18`.

Run `npm run quotes:sync` to rebuild `dailyQuotes.generated.json` from the pinned
online source. The generator applies a content allowlist/filter, normalizes
punctuation, removes duplicates, and requires exactly 366 entries.
