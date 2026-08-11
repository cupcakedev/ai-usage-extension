# Promotional Materials

Chrome Web Store requires a specific set of images for the listing. Everything
except `icon-128.png` is generated per locale — run `pnpm promo` and commit the
result. The `store:check` tests fail the release if any required file is
missing.

```bash
pnpm promo                 # every locale, every target
pnpm promo ru              # one locale
pnpm promo ru screenshot-1 # one locale, one target
pnpm promo:dev             # preview in the browser
```

Preview URLs: `?locale=de&shot=popup|overlay|providers|badge|privacy`,
`?locale=de&format=marquee|tile`.

## Layout

| Path                        | Contents                                     |
| --------------------------- | -------------------------------------------- |
| `store/promo/icon-128.png`  | Store tile icon, hand-made, shared by locales |
| `store/<locale>/promo/`     | The rendered set for that store language      |

Locales: all 53 languages the Chrome Web Store supports — the same list as
`public/_locales`, `src/promo/locale.ts` and the `LOCALES` array in
`scripts/promo.js`. (Long-form `store/<locale>/listing.md` copy exists only for
the ten largest markets.)

`ar`, `fa` and `he` render right-to-left: the copy column and the product mock
swap sides, while the mock itself stays left-to-right, exactly as the shipped
UI renders it.

## Files in each locale folder

| File               | Shows                                 | Required size |
| ------------------ | ------------------------------------- | ------------- |
| `screenshot-1.jpg` | Popup with all six providers          | 1280 × 800 px |
| `screenshot-2.jpg` | On-page overlay on Claude and ChatGPT | 1280 × 800 px |
| `screenshot-3.jpg` | Settings: language, layout, provider details | 1280 × 800 px |
| `screenshot-4.jpg` | Settings: toolbar badge and overlays  | 1280 × 800 px |
| `screenshot-5.jpg` | Provider lineup, privacy, zero setup  | 1280 × 800 px |
| `marquee.png`      | Marquee promo tile                    | 1400 × 560 px |
| `small-tile.png`   | Small promo tile                      | 440 × 280 px  |

Five screenshots is the Chrome Web Store maximum, and they are uploaded in the
order above.

## Source files

The artwork source is `src/promo/` (rendered by `scripts/promo.js`). It is
composed from the shipped popup, overlay, and options components over mock
usage, so a UI change shows up in the artwork on the next run.

Product strings are read from `public/_locales` through a `chrome.i18n` stub,
so every locale shows the wording the extension actually ships. The only
promo-specific copy — eyebrows, taglines, and the closing slide — lives in
`src/promo/copy/<locale>.json`, one file per language.

The "LIMITS" side tab in the on-page overlay is deliberately never translated,
so it reads the same in every screenshot.

If you also have editable sources (Figma, Sketch, .psd, .pen), keep them in
`promo/sources/` — anything inside `sources/` is ignored by the release
checker.

## Conventions

- All screenshots show the extension in dark mode (the host pages already use
  a dark theme).
- Never use real account data — the mock percentages and reset times live in
  `src/promo/fixtures.ts`.
- Use PNG for icons and promo tiles. Use high-quality JPEGs for screenshots to
  keep repository size reasonable.
- The product name stays in Latin script in every locale; only the surrounding
  copy is translated.
