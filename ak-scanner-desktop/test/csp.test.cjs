'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('production CSP removes development allowances while keeping local image previews', async () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const { default: config } = await import('../vite.config.js');
  const plugin = config.plugins.find((item) => item.name === 'strict-production-csp');
  assert.ok(plugin);
  assert.equal(plugin.transformIndexHtml(html, { server: {} }), html);
  const production = plugin.transformIndexHtml(html, {});
  assert.match(production, /img-src 'self' data: blob:/);
  assert.match(production, /style-src 'self'/);
  assert.match(production, /connect-src 'self'/);
  assert.doesNotMatch(production, /'unsafe-inline'|ws:\/\/127\.0\.0\.1:5173|http:\/\/127\.0\.0\.1:5173/);
});
