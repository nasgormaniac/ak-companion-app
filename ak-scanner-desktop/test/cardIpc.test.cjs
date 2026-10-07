'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDesktopDatabase } = require('../src/main/sqliteDatabase.cjs');
const { CardRepository } = require('../src/main/cardRepository.cjs');
const { registerCardIpc } = require('../src/main/cardIpc.cjs');

const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';

test('card IPC saves and replaces owned images, lists records, and deletes both', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-card-ipc-'));
  const database = openDesktopDatabase(root);
  const handlers = new Map();
  const ipcMain = { handle: (key, handler) => handlers.set(key, handler), removeHandler: (key) => handlers.delete(key) };
  const frame = { url: 'file:///app/index.html' };
  const contents = { mainFrame: frame };
  const event = { sender: contents, senderFrame: frame };
  const unregister = registerCardIpc({ ipcMain, mainWindow: { webContents: contents }, repository: new CardRepository(database.db), userDataPath: root, trustedFrameUrl: frame.url });
  const call = (channel, ...args) => handlers.get(channel)(event, ...args);
  try {
    const input = { category: 'animal', nama: 'Lion', rarity: 'common', card_code: 'bn123456', gold_attack: 'G', card_type: 'speed' };
    assert.equal(call('cards:create', { ...input, card_code: 'BN123456' }, tinyPng).code, 'INVALID_CARD');
    assert.equal(call('cards:create', { ...input, image_path: 'a'.repeat(32) + '.png' }, tinyPng).code, 'INVALID_CARD');
    assert.equal(call('cards:create', input, tinyPng, 'extra').code, 'INVALID_PAYLOAD');
    assert.equal(call('cards:create', input, 'data:image/png;base64,AA==').code, 'INVALID_IMAGE');
    const oversized = `data:image/png;base64,${Buffer.alloc(1024 * 1024 + 1).toString('base64')}`;
    assert.equal(call('cards:create', input, oversized).code, 'INVALID_IMAGE');
    assert.equal(call('cards:create', input, 'data:image/png;base64,AAAA').code, 'INVALID_IMAGE');
    const fakePng = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')}`;
    const fakeJpeg = `data:image/jpeg;base64,${Buffer.from([255, 216, 1, 2, 255, 217]).toString('base64')}`;
    assert.equal(call('cards:create', input, fakePng).code, 'INVALID_IMAGE');
    assert.equal(call('cards:create', input, fakeJpeg).code, 'INVALID_IMAGE');
    assert.equal(fs.readdirSync(path.join(root, 'images')).length, 0);
    const created = call('cards:create', input, tinyPng);
    assert.equal(created.ok, true, created.message);
    const id = created.data.id;
    const firstImage = created.data.image_path;
    assert.equal(fs.existsSync(path.join(root, 'images', firstImage)), true);
    assert.equal(call('cards:list', { category: 'animal', page: 1 }).data.total, 1);
    assert.equal(call('cards:image', firstImage).data, tinyPng);
    fs.appendFileSync(path.join(root, 'images', firstImage), Buffer.alloc(1024 * 1024));
    assert.equal(call('cards:image', firstImage).ok, true);
    assert.equal(call('cards:image', '../settings.json').code, 'INVALID_IMAGE');
    assert.equal(call('cards:image', 'a'.repeat(32) + '.png').code, 'IMAGE_NOT_FOUND');
    assert.equal(call('cards:get', 0).code, 'INVALID_ID');
    assert.equal(call('cards:list', { category: 'animal', filters: { aura: 'none' } }).code, 'INVALID_QUERY');
    assert.equal(call('cards:update', id, { image_path: 'a'.repeat(32) + '.png' }, null).code, 'INVALID_CARD');
    assert.equal(call('cards:update', id, { nama: 'Changed' }, false).code, 'INVALID_IMAGE');
    assert.equal(call('cards:update', id, { guts_level: 2.5 }, null).code, 'INVALID_CARD');
    assert.equal(call('cards:update', id, { category: 'strong' }, null).code, 'INVALID_CARD');
    assert.equal(call('cards:get', id).data.nama, 'Lion');
    const duplicate = call('cards:create', { ...input, nama: 'Other' }, tinyPng);
    assert.equal(duplicate.code, 'DUPLICATE_CODE');
    const crossCategoryDuplicate = call('cards:create', { category: 'strong', nama: 'Dup', rarity: 'common', card_code: input.card_code, guts_level: 1, tech_level: 1, power_level: 1, aura: 'none' }, tinyPng);
    assert.equal(crossCategoryDuplicate.code, 'DUPLICATE_CODE');
    assert.equal(fs.readdirSync(path.join(root, 'images')).length, 1);
    const updated = call('cards:update', id, { nama: 'Golden Lion' }, tinyPng);
    assert.equal(updated.ok, true, updated.message);
    assert.notEqual(updated.data.image_path, firstImage);
    assert.equal(fs.existsSync(path.join(root, 'images', firstImage)), false);
    assert.equal(call('cards:delete', id).ok, true);
    assert.equal(fs.readdirSync(path.join(root, 'images')).length, 0);
    assert.equal(call('cards:list', { category: 'animal', page: 1 }).data.total, 0);
    const strong = call('cards:create', { category: 'strong', nama: 'Strong', rarity: 'gold', card_code: 'bn!@#$%^', guts_level: 1, tech_level: 2, power_level: 3, aura: 'burning' }, tinyPng);
    const miracle = call('cards:create', { category: 'miracle', nama: 'Miracle', rarity: 'silver', card_code: 'bnABCDEF', card_type: 'multi', effect: 'Slot Jammer' }, tinyPng);
    assert.equal(strong.ok, true, strong.message);
    assert.equal(miracle.ok, true, miracle.message);
    assert.equal(call('cards:list', { category: 'strong', filters: { power_level: 3 } }).data.total, 1);
    assert.equal(call('cards:list', { category: 'miracle', filters: { effect: 'Slot Jammer' } }).data.total, 1);
    assert.equal(call('cards:image', strong.data.image_path).ok, true);
    assert.equal(call('cards:image', miracle.data.image_path).ok, true);
    assert.equal(call('cards:delete', strong.data.id).ok, true);
    assert.equal(call('cards:delete', miracle.data.id).ok, true);
    assert.equal(call('cards:create', input, 'data:image/png;base64,AA==').code, 'INVALID_IMAGE');
  } finally {
    unregister(); database.close(); fs.rmSync(root, { recursive: true, force: true });
  }
});

test('replacement and failed-create cleanup warnings are visible and orphan files are retried on startup', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-card-cleanup-'));
  const database = openDesktopDatabase(root);
  const repository = new CardRepository(database.db);
  const handlers = new Map();
  const ipcMain = { handle: (key, handler) => handlers.set(key, handler), removeHandler: (key) => handlers.delete(key) };
  const frame = { url: 'file:///app/index.html' };
  const contents = { mainFrame: frame };
  const event = { sender: contents, senderFrame: frame };
  const fileOps = Object.create(fs);
  let blockRemoval = false;
  fileOps.rmSync = (file, options) => { if (blockRemoval) throw Object.assign(new Error('locked'), { code: 'EACCES' }); fs.rmSync(file, options); };
  const register = () => registerCardIpc({ ipcMain, mainWindow: { webContents: contents }, repository, userDataPath: root, trustedFrameUrl: frame.url, fileOps });
  let unregister = register();
  const call = (channel, ...args) => handlers.get(channel)(event, ...args);
  try {
    const input = { category: 'animal', nama: 'Lion', rarity: 'common', card_code: 'bn123456', gold_attack: 'G', card_type: 'speed' };
    const created = call('cards:create', input, tinyPng);
    assert.equal(created.ok, true);
    blockRemoval = true;
    const updated = call('cards:update', created.data.id, { nama: 'Lion Two' }, tinyPng);
    assert.equal(updated.ok, true);
    assert.equal(updated.data.imageCleanupFailed, true);
    const duplicate = call('cards:create', input, tinyPng);
    assert.equal(duplicate.code, 'DUPLICATE_CODE');
    assert.equal(duplicate.cleanupWarning, true);
    assert.equal(fs.readdirSync(path.join(root, 'images')).length, 3);
    unregister(); blockRemoval = false; unregister = register();
    assert.equal(fs.readdirSync(path.join(root, 'images')).length, 3, 'recent unreferenced images keep a grace period');
    const oldDate = new Date(Date.now() - 2 * 60 * 1000);
    for (const name of fs.readdirSync(path.join(root, 'images'))) {
      if (!repository.hasImage(name)) fs.utimesSync(path.join(root, 'images', name), oldDate, oldDate);
    }
    unregister(); unregister = register();
    assert.equal(fs.readdirSync(path.join(root, 'images')).length, 1);
    assert.equal(call('cards:image', updated.data.image_path).ok, true);
  } finally {
    unregister(); database.close(); fs.rmSync(root, { recursive: true, force: true });
  }
});

test('empty first launch accepts images for all three categories and retains them after restart', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-card-restart-'));
  const handlers = new Map();
  const ipcMain = { handle: (key, handler) => handlers.set(key, handler), removeHandler: (key) => handlers.delete(key) };
  const frame = { url: 'file:///app/index.html' };
  const contents = { mainFrame: frame };
  const event = { sender: contents, senderFrame: frame };
  const call = (channel, ...args) => handlers.get(channel)(event, ...args);
  let opened = openDesktopDatabase(root);
  let unregister = registerCardIpc({ ipcMain, mainWindow: { webContents: contents }, repository: new CardRepository(opened.db), userDataPath: root, trustedFrameUrl: frame.url });
  try {
    for (const category of ['animal', 'strong', 'miracle']) assert.equal(call('cards:list', { category }).data.total, 0);
    const fixtures = [
      { category: 'animal', nama: 'Lion', rarity: 'common', card_code: 'bn123456', gold_attack: 'G', card_type: 'speed' },
      { category: 'strong', nama: 'Power', rarity: 'bronze', card_code: 'bn!@#$%^', guts_level: 1, tech_level: 2, power_level: 3, aura: 'burning' },
      { category: 'miracle', nama: 'Guard', rarity: 'silver', card_code: 'bnABCDEF', card_type: 'multi', effect: 'G Guard' },
    ];
    const created = fixtures.map((card) => call('cards:create', card, tinyPng));
    for (const result of created) assert.equal(result.ok, true, result.message);
    unregister(); opened.close();
    opened = openDesktopDatabase(root);
    unregister = registerCardIpc({ ipcMain, mainWindow: { webContents: contents }, repository: new CardRepository(opened.db), userDataPath: root, trustedFrameUrl: frame.url });
    for (const [index, fixture] of fixtures.entries()) {
      const listed = call('cards:list', { category: fixture.category });
      assert.equal(listed.data.total, 1);
      assert.equal(listed.data.items[0].card_code, fixture.card_code);
      assert.equal(call('cards:image', created[index].data.image_path).data, tinyPng);
    }
  } finally { unregister(); opened.close(); fs.rmSync(root, { recursive: true, force: true }); }
});
