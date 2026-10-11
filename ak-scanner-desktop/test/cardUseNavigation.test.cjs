'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('Use on Home picks stays on Home for every card category', async () => {
  const { nextViewAfterCardUse } = await import('../src/renderer/cardUseNavigation.js');
  for (const category of ['animal', 'strong', 'miracle']) {
    assert.equal(nextViewAfterCardUse('home', category), null);
  }
});

test('Use in catalogue follows the category sequence', async () => {
  const { nextViewAfterCardUse } = await import('../src/renderer/cardUseNavigation.js');
  assert.deepEqual(nextViewAfterCardUse('catalogue', 'animal'), { name: 'catalogue', category: 'strong' });
  assert.deepEqual(nextViewAfterCardUse('catalogue', 'strong'), { name: 'catalogue', category: 'miracle' });
  assert.deepEqual(nextViewAfterCardUse('catalogue', 'miracle'), { name: 'home' });
});
