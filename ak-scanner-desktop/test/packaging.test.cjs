'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../package.json');
const lockfile = require('../package-lock.json');

test('Windows installer icon and NSIS release configuration', () => {
  const icon = fs.readFileSync(path.join(__dirname, '..', 'assets', 'app.ico'));
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  const count = icon.readUInt16LE(4);
  assert.ok(count >= 5);
  const sizes = [];
  for (let index = 0; index < count; index += 1) {
    const entry = 6 + 16 * index;
    sizes.push(icon[entry] || 256);
    const length = icon.readUInt32LE(entry + 8);
    const offset = icon.readUInt32LE(entry + 12);
    assert.ok(offset >= 6 + 16 * count);
    assert.ok(offset + length <= icon.length);
    assert.equal(icon.subarray(offset, offset + 8).toString('hex'), '89504e470d0a1a0a');
  }
  assert.ok(sizes.includes(16) && sizes.includes(32) && sizes.includes(256));
  assert.equal(manifest.version, lockfile.version);
  assert.equal(manifest.version, lockfile.packages[''].version);
  assert.equal(manifest.productName, 'Animal Kaiser Scanner');
  assert.equal(manifest.build.win.target, 'nsis');
  assert.equal(manifest.build.nsis.oneClick, false);
  assert.equal(manifest.build.nsis.allowToChangeInstallationDirectory, true);
  assert.equal(manifest.build.nsis.createDesktopShortcut, 'always');
  const installer = fs.readFileSync(path.join(__dirname, '..', 'build', 'installer.nsh'), 'utf8');
  assert.match(installer, /!macro customUnInstall/);
  assert.match(installer, /!define UNINSTALL_FILENAME "Uninstall\.exe"/);
  assert.match(installer, /cleanup-shortcuts\.ps1/);
  assert.match(installer, /UninstPage custom un\.dataPageCreate/);
  assert.match(installer, /RMDir \/r "\$APPDATA\\AK Scanner"/);
});
