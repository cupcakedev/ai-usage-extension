# Promotional Materials

Chrome Web Store requires a specific set of images for the listing. Every file
below except `icon-128.png` is generated — run `pnpm promo` and commit the
result. The `store:check` tests will fail the release if any required file is
missing or has the wrong format.

```bash
pnpm promo              # render every target into this folder
pnpm promo screenshot-1 # re-render a single target
pnpm promo:dev          # preview in the browser
```

Preview URLs: `?shot=popup|overlay|providers|badge|privacy`,
`?format=marquee|tile`.

The renders live in `src/promo/` and are composed from the shipped popup,
overlay, and options components over mock usage (`src/promo/fixtures.ts`), so a
UI change shows up in the artwork on the next run. Marketing copy is
English-only in `src/promo/copy.ts`; wording that also appears in the product
comes from `msg()` and the components themselves.

## Required files

| File               | Shows                                     | Required size |
| ------------------ | ----------------------------------------- | ------------- |
| `icon-128.png`     | Store tile icon (hand-made, not rendered) | 128 × 128 px  |
| `screenshot-1.jpg` | Popup with all six providers              | 1280 × 800 px |
| `screenshot-2.jpg` | On-page overlay on Claude and ChatGPT     | 1280 × 800 px |
| `screenshot-3.jpg` | Settings: layout and provider details     | 1280 × 800 px |
| `screenshot-4.jpg` | Settings: toolbar badge and overlays      | 1280 × 800 px |
| `screenshot-5.jpg` | Provider lineup, privacy, zero setup      | 1280 × 800 px |
| `marquee.png`      | Marquee promo tile                        | 1400 × 560 px |
| `small-tile.png`   | Small promo tile                          | 440 × 280 px  |

Five screenshots is the Chrome Web Store maximum, and they are uploaded in the
order above.

## Source files

The artwork source is `src/promo/` (rendered by `scripts/promo.js`). If you
also have editable sources (Figma, Sketch, .psd, .pen), keep them in
`promo/sources/` — anything inside `sources/` is ignored by the release
checker.

## Conventions

- All screenshots should show the extension in dark mode (the host pages
  already use a dark theme).
- Do not use real account data in screenshots — mock the percentages and the
  reset times so the listing does not leak personal usage.
- Use PNG for icons and promo tiles. Use high-quality JPEGs for screenshots to
  keep repository size reasonable.
