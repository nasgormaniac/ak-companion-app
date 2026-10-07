'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readGameSettings, writeGameSettings, settingsPath } = require('../src/main/gameSettings.cjs');

test('game port uses a safe default and persists only valid port values', () => {
  const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-scanner-game-test-'));
  try {
    assert.equal(readGameSettings(userDataPath).port, 9876);
    writeGameSettings(userDataPath, 9898);
    assert.equal(readGameSettings(userDataPath).port, 9898);
    assert.throws(() => writeGameSettings(userDataPath, 0), TypeError);
    assert.equal(readGameSettings(userDataPath).port, 9898);
    fs.writeFileSync(settingsPath(userDataPath), '{broken');
    assert.equal(readGameSettings(userDataPath).port, 9876);
  } finally {
    fs.rmSync(userDataPath, { recursive: true, force: true });
  }
});
