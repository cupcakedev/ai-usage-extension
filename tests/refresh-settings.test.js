import { it } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.js';

it('preserves automatic defaults and normalizes stored refresh preferences', () => {
  const { normalizeSettings } = loadTypeScript('src/shared/settings.ts');
  const legacy = normalizeSettings({ popupLayout: 'grid' });
  assert.equal(legacy.refresh.mode, 'auto');
  assert.equal(legacy.refresh.intervalMinutes, 5);
  const custom = normalizeSettings({ refresh: { mode: 'manual', intervalMinutes: 12.5 } });
  assert.equal(custom.refresh.mode, 'manual');
  assert.equal(custom.refresh.intervalMinutes, 12.5);
  for (const intervalMinutes of [0, '10', Infinity]) {
    assert.equal(normalizeSettings({ refresh: { intervalMinutes } }).refresh.intervalMinutes, 5);
  }
});
