/**
 * Release-gate tests for the `store/` directory.
 *
 * These run on `npm test` (and therefore on `npm run release`, which depends
 * on them). They enforce that everything we paste into the Chrome Web Store
 * submission form lives in version control and stays in sync with the
 * manifest.
 *
 * If you add a permission or host_permission to manifest.json, you MUST add
 * a matching `## ` heading to store/permissions.md or these tests will fail.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const read = (relPath) => readFileSync(resolve(root, relPath), 'utf8');

const headings = (markdown) =>
  markdown
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace(/^##\s+/, '').trim());

const sectionBody = (markdown, heading) => {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return '';
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
};

const manifest = JSON.parse(read('manifest.json'));

const hostHeading = (host) => `host: ${host}`;

const expectedPermissionHeadings = [
  ...(manifest.permissions ?? []),
  ...((manifest.host_permissions ?? []).map(hostHeading)),
];

const CHROME_SHORT_DESCRIPTION_MAX = 132;
const SEO_FULL_DESCRIPTION_MIN = 600;
const PERMISSION_RATIONALE_MIN = 60;
const localizedStoreLocales = ['en', 'es', 'fr', 'de', 'it', 'pt_BR', 'ru', 'ja', 'zh_CN', 'hi'];
const requiredListingHeadings = [
  'Name',
  'Short Description',
  'Full Description',
  'Keywords',
  'Single Purpose',
];

describe('store/listing.md', () => {
  const path = 'store/listing.md';

  it('exists', () => {
    assert.ok(existsSync(resolve(root, path)), `${path} is missing`);
  });

  const listing = read(path);
  const present = new Set(headings(listing));

  for (const required of requiredListingHeadings) {
    it(`has the "## ${required}" section`, () => {
      assert.ok(
        present.has(required),
        `${path} must contain a "## ${required}" heading`,
      );
    });
  }

  it('Name is a single non-empty line', () => {
    const body = sectionBody(listing, 'Name');
    assert.notEqual(body.length, 0, 'Name section is empty');
    assert.ok(!body.includes('\n\n'), 'Name section should be a single line');
  });

  it(`Short Description fits in ${CHROME_SHORT_DESCRIPTION_MAX} characters`, () => {
    const body = sectionBody(listing, 'Short Description');
    assert.notEqual(body.length, 0, 'Short Description is empty');
    assert.ok(
      body.length <= CHROME_SHORT_DESCRIPTION_MAX,
      `Short Description is ${body.length} chars, max is ${CHROME_SHORT_DESCRIPTION_MAX}`,
    );
  });

  it(`Full Description is SEO-substantial (>= ${SEO_FULL_DESCRIPTION_MIN} chars)`, () => {
    const body = sectionBody(listing, 'Full Description');
    assert.ok(
      body.length >= SEO_FULL_DESCRIPTION_MIN,
      `Full Description is only ${body.length} chars; aim for >=${SEO_FULL_DESCRIPTION_MIN} for SEO`,
    );
  });

  it('Keywords lists at least 5 search terms', () => {
    const body = sectionBody(listing, 'Keywords');
    const terms = body
      .replace(/\s+/g, ' ')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    assert.ok(terms.length >= 5, `Keywords has only ${terms.length} terms (need >= 5)`);
  });
});

describe('localized store listings', () => {
  for (const locale of localizedStoreLocales) {
    const path = `store/${locale}/listing.md`;

    it(`${path} has complete Chrome Web Store copy`, () => {
      assert.ok(existsSync(resolve(root, path)), `${path} is missing`);

      const listing = read(path);
      const present = new Set(headings(listing));

      for (const required of requiredListingHeadings) {
        assert.ok(present.has(required), `${path} must contain a "## ${required}" heading`);
      }

      const shortDescription = sectionBody(listing, 'Short Description');
      const fullDescription = sectionBody(listing, 'Full Description');
      const keywords = sectionBody(listing, 'Keywords')
        .replace(/\s+/g, ' ')
        .split(',')
        .map((term) => term.trim())
        .filter(Boolean);

      assert.ok(
        shortDescription.length <= CHROME_SHORT_DESCRIPTION_MAX,
        `${path} Short Description is ${shortDescription.length} chars, max is ${CHROME_SHORT_DESCRIPTION_MAX}`,
      );
      assert.ok(
        fullDescription.length >= SEO_FULL_DESCRIPTION_MIN,
        `${path} Full Description is only ${fullDescription.length} chars; aim for >=${SEO_FULL_DESCRIPTION_MIN} for SEO`,
      );
      assert.ok(keywords.length >= 5, `${path} Keywords has only ${keywords.length} terms`);
    });
  }
});

describe('extension localization', () => {
  it('manifest uses Chrome i18n message placeholders', () => {
    assert.equal(manifest.default_locale, 'en');
    assert.equal(manifest.name, '__MSG_appName__');
    assert.equal(manifest.description, '__MSG_appDescription__');
    assert.equal(manifest.action.default_title, '__MSG_appShortName__');
  });

  it('all locale message files exist and expose the same keys', () => {
    const basePath = 'public/_locales/en/messages.json';
    const baseMessages = JSON.parse(read(basePath));
    const baseKeys = Object.keys(baseMessages).sort();

    for (const locale of localizedStoreLocales) {
      const path = `public/_locales/${locale}/messages.json`;
      assert.ok(existsSync(resolve(root, path)), `${path} is missing`);

      const messages = JSON.parse(read(path));
      assert.deepEqual(Object.keys(messages).sort(), baseKeys, `${path} has mismatched keys`);
      assert.ok(
        messages.appDescription.message.length <= CHROME_SHORT_DESCRIPTION_MAX,
        `${path} appDescription is ${messages.appDescription.message.length} chars, max is ${CHROME_SHORT_DESCRIPTION_MAX}`,
      );
    }
  });

  it('every fallback string in src/shared/i18n.ts is translated in every locale', () => {
    const fallbackKeys = [...read('src/shared/i18n.ts').matchAll(/^ {2}([A-Za-z0-9_]+):/gm)].map(
      (match) => match[1],
    );
    assert.ok(fallbackKeys.length > 0, 'no fallback keys parsed from src/shared/i18n.ts');

    const baseKeys = new Set(Object.keys(JSON.parse(read('public/_locales/en/messages.json'))));
    const untranslated = fallbackKeys.filter((key) => !baseKeys.has(key));
    assert.deepEqual(untranslated, [], `fallback keys missing from _locales: ${untranslated}`);
  });
});

describe('store/permissions.md', () => {
  const path = 'store/permissions.md';

  it('exists', () => {
    assert.ok(existsSync(resolve(root, path)), `${path} is missing`);
  });

  const perms = read(path);
  const documented = new Set(headings(perms));

  for (const required of expectedPermissionHeadings) {
    it(`documents "${required}" from manifest.json`, () => {
      assert.ok(
        documented.has(required),
        `${path} is missing a "## ${required}" section. Every manifest permission and host_permission must be justified.`,
      );

      const body = sectionBody(perms, required);
      assert.ok(
        body.length >= PERMISSION_RATIONALE_MIN,
        `Rationale for "${required}" is only ${body.length} chars; write at least ${PERMISSION_RATIONALE_MIN} explaining why the extension needs it.`,
      );
    });
  }

  it('does not document permissions that the manifest no longer requests', () => {
    const expected = new Set(expectedPermissionHeadings);
    const stray = [...documented].filter((h) => !expected.has(h));
    assert.deepEqual(
      stray,
      [],
      `permissions.md documents headings that aren't in manifest.json: ${stray.join(', ')}`,
    );
  });
});

describe('store/promo/', () => {
  const promoDir = resolve(root, 'store/promo');

  it('directory exists', () => {
    assert.ok(existsSync(promoDir), 'store/promo/ is missing');
  });

  it('has the README that explains required assets', () => {
    assert.ok(existsSync(resolve(promoDir, 'README.md')), 'store/promo/README.md is missing');
  });

  // Required image assets — small/marquee tiles are optional in the README and
  // therefore not enforced. Add to this list once they are required.
  const requiredAssets = ['icon-128.png', 'screenshot-1.jpg', 'screenshot-2.jpg'];

  for (const asset of requiredAssets) {
    it(`has ${asset}`, () => {
      const p = resolve(promoDir, asset);
      assert.ok(existsSync(p), `store/promo/${asset} is missing`);
      assert.ok(statSync(p).size > 0, `store/promo/${asset} is empty`);
    });
  }
});
