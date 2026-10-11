'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const picks = { animal: { id: 10 }, strong: { id: 20 }, miracle: { id: 30 } };

test('Quick Scan sends Animal, Strong, Miracle with two equal 3 second waits', async () => {
  const { sendTrioSequentially, QUICK_SCAN_DELAY_MS } = await import('../src/renderer/quickScan.js');
  const sent = [];
  const waits = [];
  const progress = [];
  const result = await sendTrioSequentially(picks,
    async (id) => { sent.push(id); return { ok: true }; },
    async (ms) => { waits.push(ms); },
    (step) => progress.push(`${step.stage}:${step.category}`));
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(sent, [10, 20, 30]);
  assert.deepEqual(waits, [QUICK_SCAN_DELAY_MS, QUICK_SCAN_DELAY_MS]);
  assert.equal(QUICK_SCAN_DELAY_MS, 3000);
  assert.deepEqual(progress, ['sending:animal', 'waiting:strong', 'sending:strong', 'waiting:miracle', 'sending:miracle']);
});

test('Quick Scan stops at the failed card and does not send later cards', async () => {
  const { sendTrioSequentially } = await import('../src/renderer/quickScan.js');
  const sent = [];
  const waits = [];
  const result = await sendTrioSequentially(picks,
    async (id) => { sent.push(id); return id === 20 ? { ok: false, message: 'Game unavailable.' } : { ok: true }; },
    async (ms) => { waits.push(ms); });
  assert.deepEqual(result, { ok: false, category: 'strong', message: 'Game unavailable.' });
  assert.deepEqual(sent, [10, 20]);
  assert.deepEqual(waits, [3000]);
});
