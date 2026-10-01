import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTypeScript } from './helpers/load-typescript.js';

describe('percentage display preferences', () => {
  const { createDefaultSettings, normalizeSettings } = loadTypeScript('src/shared/settings.ts');

  it('preserves defaults for existing installations and normalizes stored preferences', () => {
    const legacy = normalizeSettings({ popupLayout: 'grid' });
    assert.equal(legacy.percentageDisplay, 'used');
    const custom = normalizeSettings({
      percentageDisplay: 'remaining',
    });
    assert.equal(custom.percentageDisplay, 'remaining');
  });

  it('formats the complement of rounded, bounded usage', () => {
    const { formatUsagePercent } = loadTypeScript('src/shared/utils/index.ts');
    assert.equal(formatUsagePercent(13, 'used'), '13% used');
    assert.equal(formatUsagePercent(13, 'remaining'), '87% left');
    assert.equal(formatUsagePercent(12.6, 'remaining'), '87% left');
    assert.equal(formatUsagePercent(105, 'remaining'), '0% left');
    assert.equal(formatUsagePercent(-5, 'remaining'), '100% left');
  });

  it('matches session, weekly and model fills to the display mode while preserving warning tones', () => {
    const { ProviderCard } = loadTypeScript('src/sidepanel/components/ProviderCard.tsx');
    const limit = (percentage) => ({ percentage, resetsAt: null });
    const usage = {
      session: limit(13),
      weekly: limit(93),
      models: [{ id: 'model', label: 'Model', limit: limit(75) }],
      lastUpdated: 123,
    };
    const render = (percentageDisplay) =>
      renderToStaticMarkup(
        createElement(ProviderCard, {
          title: 'Provider',
          usage,
          now: 123,
          loading: false,
          emptyHint: '',
          percentageDisplay,
        }),
      );
    const used = render('used');
    const remaining = render('remaining');
    for (const text of ['13% used', '93% used', '75% used']) assert.ok(used.includes(text));
    for (const text of ['87% left', '7% left', '25% left']) assert.ok(remaining.includes(text));
    for (const value of [13, 93, 75]) {
      assert.ok(used.includes(`aria-valuenow="${value}"`));
      assert.ok(used.includes(`width:${value}%`));
      assert.ok(remaining.includes(`aria-valuenow="${100 - value}"`));
      assert.ok(remaining.includes(`width:${100 - value}%`));
    }
    assert.ok(remaining.includes('aria-valuetext="87% left"'));
    for (const html of [used, remaining]) {
      assert.ok(html.includes('au-meter--critical'));
      assert.ok(html.includes('au-meter--warning'));
    }
  });

  it('changes badge tooltip percentages while retaining the highest-used icon range', async () => {
    const settings = createDefaultSettings();
    settings.percentageDisplay = 'remaining';
    const icons = [];
    let title;
    const { updateBadge } = loadTypeScript('src/background/badge.ts', {
      globals: {
        chrome: {
          runtime: { getURL: (path) => path },
          action: {
            setIcon: async () => {},
            setBadgeText: async () => {},
            setTitle: async (value) => {
              title = value.title;
            },
          },
        },
        fetch: async (path) => {
          icons.push(path);
          return { ok: true, blob: async () => ({}) };
        },
        OffscreenCanvas: class {
          getContext() {
            return { drawImage() {}, getImageData: () => ({}) };
          }
        },
        createImageBitmap: async () => ({ close() {} }),
      },
      mocks: { '../shared/settings': { readExtensionSettings: async () => settings } },
    });
    const usage = (percentage) => ({ session: { percentage, resetsAt: null } });
    await updateBadge({ claude: usage(13), codex: usage(93) });
    assert.ok(title.includes('87% left'));
    assert.ok(title.includes('7% left'));
    assert.ok(icons.every((path) => path === 'icons/badges/range-90.png'));
  });
});
