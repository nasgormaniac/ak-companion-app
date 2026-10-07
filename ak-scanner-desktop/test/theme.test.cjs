'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('light, dark, persisted, and invalid theme preferences resolve consistently', async () => {
  const { resolveTheme, applyTheme } = await import('../src/renderer/theme.js');
  assert.equal(resolveTheme(null, false), 'light');
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('unexpected', true), 'dark');
  const root = { dataset: {} };
  const saved = new Map();
  const storage = { setItem: (key, value) => saved.set(key, value), getItem: (key) => saved.get(key) };
  applyTheme(root, storage, 'dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(resolveTheme(storage.getItem('ak-scanner-theme'), false), 'dark');
  applyTheme(root, { setItem: () => { throw new Error('storage denied'); } }, 'light');
  assert.equal(root.dataset.theme, 'light');
});
