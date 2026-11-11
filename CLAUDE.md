# ds

Micah Lindenberger's design system page. The tokens, type, color, motion,
components, layouts and writing rules behind his portfolio and case studies,
shown live. Mirrors the `micah-design-system` skill: when one changes, update
the other.

Live at https://ds.micahburger.com

## Deploy — read this before you push

**Hostinger auto-deploys from `main`, serving the repo root.** There is no
build step: `index.html`, `css/`, `js/` and `fonts/` are served exactly as
committed. Pushing `main` is the deploy.

- Bump the `?v=` query on the CSS and JS links in `index.html` when you change
  those files, so returning visitors don't get a cached copy.
- Remote sessions (claude.ai/code, cloud Claude) can't push `main`. Work on a
  branch there; merge and push from the Mac.

Same pattern as the other subdomains: each is its own GitHub repo connected
to its own subdomain in hPanel (Websites > the subdomain > Advanced > Git),
with auto-deploy on.

## Running it

No install needed. From the repo root:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Check mobile at 390px wide with no horizontal scroll: the comp cards and the
voice rows have both overflowed before.

## Layout of the source

```
index.html        all content, 12 sections, set in the case study register it documents
css/tokens.css    every token; the file people copy into a new project
css/styles.css    the page: shell ported from applicants, then one block per section
js/shell.js       section tracking, chapter menu (bar that morphs into the jump list), keyboard nav, reveal
js/demos.js       swatches, copy-to-clipboard, every live motion demo
js/hero.js        the hero scramble, copied verbatim from applicants
fonts/            Proxima Nova (licensed, self-hosted, as on 2026folio)
```

## Source of truth for the case study register

The long-form register (`--page-*`, `--cs-*`, `--radius-media/card/phone`,
`--content`, `--gutter`) is copied from v2: `app/src/styles/global.css` in
micahburger/v2 (`../v2-site`), its Night palette (`:root[data-palette="night"]`)
and the case study scale in `:root`, mobile values in its 900px block.
applicants.micahburger.com mirrors the same values. When v2 changes, change
`css/tokens.css` and the Color, Typography and Space sections here to match.
It replaced the lattice-derived Graphite register (Instrument Sans, Inter,
Plex Mono labels, #161516, 1080px) on 2026-11-10; don't bring those back.

The deck register (`--deck-*`, Proxima Nova, Inter for its header and pills)
is 2026folio's and stays as it is.

## Rules

- Values come from the live sites. Don't invent a color or a curve; if a new
  one is needed, add it to the skill first.
- No em dashes in page copy. Headlines are short sentences with a period.
- Poppins is loaded at 400 and 500 only; Inter at 400 and 500 for the deck
  samples. Never ask for another weight, or the browser synthesizes it.
- Pills, round buttons and the chapter bar are a `--page-chip` fill with no
  stroke and no shadow. Shadows are for objects (phones, floating previews).
- `--page-accent` is for large marks only (numbers, pull lines, the active
  nav item). Never body text, never under 18px.
- Every animation has a reduced-motion path. Test with the DevTools
  rendering panel before pushing.
