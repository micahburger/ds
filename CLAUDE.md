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

## Layout of the source

```
index.html        all content, 11 sections in the Graphite long-form register
css/tokens.css    every token; the file people copy into a new project
css/styles.css    the page: shell ported from applicants, then one block per section
js/shell.js       section tracking, pill nav + jump list, keyboard nav, reveal
js/demos.js       swatches, copy-to-clipboard, every live motion demo
js/hero.js        the hero scramble, copied verbatim from applicants
fonts/            Proxima Nova (licensed, self-hosted, as on 2026folio)
```

## Rules

- Values come from the live sites. Don't invent a color or a curve; if a new
  one is needed, add it to the skill first.
- No em dashes in page copy. Headlines are short sentences with a period.
- `--page-accent` is for large marks only (numbers, pull lines, the active
  nav item). Never body text, never under 18px.
- Every animation has a reduced-motion path. Test with the DevTools
  rendering panel before pushing.
