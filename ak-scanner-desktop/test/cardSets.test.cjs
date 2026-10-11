'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { openDesktopDatabase, databasePath } = require('../src/main/sqliteDatabase.cjs');
const { MIGRATIONS } = require('../src/main/sqliteSchema.cjs');
const { CardRepository } = require('../src/main/cardRepository.cjs');
const { CardSetRepository } = require('../src/main/cardSetRepository.cjs');
const { registerCardSetIpc } = require('../src/main/cardSetIpc.cjs');

function withData(work) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-card-sets-'));
  try { return work(dir); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

const image = (letter) => `${letter.repeat(32)}.png`;
function seed(cards) {
  const animal = cards.create({ category: 'animal', nama: 'Brutus', rarity: 'gold', card_code: 'bn123456', image_path: image('a'), gold_attack: 'G', card_type: 'speed' });
  const strong = cards.create({ category: 'strong', nama: 'Shining Claw', rarity: 'gold', card_code: 'bn654321', image_path: image('b'), guts_level: 5, tech_level: 2, power_level: 1, aura: 'shining' });
  const miracle = cards.create({ category: 'miracle', nama: 'Lucky Break', rarity: 'gold', card_code: 'bnABCDEF', image_path: image('c'), card_type: 'speed', effect: 'Lucky Break' });
  return { animal, strong, miracle };
}

test('v1.1 schema upgrades to Card Sets with a pre-upgrade backup and unchanged cards and images', () => withData((dir) => {
  fs.mkdirSync(path.dirname(databasePath(dir)), { recursive: true });
  const old = new DatabaseSync(databasePath(dir));
  old.exec(MIGRATIONS[0].sql);
  old.exec(MIGRATIONS[1].sql);
  old.exec('PRAGMA user_version = 2');
  old.prepare(`INSERT INTO cards(category,nama,rarity,card_code,image_path,gold_attack,card_type)
    VALUES ('animal','Existing','common','bn123456',?,'G','speed')`).run(image('a'));
  old.close();
  fs.mkdirSync(path.join(dir, 'images'));
  fs.writeFileSync(path.join(dir, 'images', image('a')), 'owned image bytes');
  const opened = openDesktopDatabase(dir);
  try {
    assert.equal(opened.db.prepare('PRAGMA user_version').get().user_version, 3);
    assert.equal(opened.db.prepare('SELECT count(*) AS n FROM cards').get().n, 1);
    assert.equal(opened.db.prepare('SELECT count(*) AS n FROM card_sets').get().n, 0);
    assert.equal(fs.readFileSync(path.join(dir, 'images', image('a')), 'utf8'), 'owned image bytes');
    assert.ok(opened.preUpgradeBackup);
    const backup = new DatabaseSync(path.join(opened.preUpgradeBackup, 'ak-scanner.sqlite'), { readOnly: true });
    assert.equal(backup.prepare('PRAGMA user_version').get().user_version, 2);
    assert.equal(backup.prepare('SELECT count(*) AS n FROM cards').get().n, 1);
    backup.close();
    assert.equal(fs.readFileSync(path.join(opened.preUpgradeBackup, 'images', image('a')), 'utf8'), 'owned image bytes');
  } finally { opened.close(); }
}));

test('Card Sets use three card IDs, reject duplicates and wrong categories, and protect source cards', () => withData((dir) => {
  const opened = openDesktopDatabase(dir);
  try {
    const cards = new CardRepository(opened.db);
    const sets = new CardSetRepository(opened.db);
    const { animal, strong, miracle } = seed(cards);
    const input = { animal_card_id: animal.id, strong_card_id: strong.id, miracle_card_id: miracle.id };
    const first = sets.create(input);
    assert.equal(first.animal.nama, 'Brutus');
    assert.equal(first.strong.nama, 'Shining Claw');
    assert.equal(sets.get(first.id).miracle.id, miracle.id);
    assert.throws(() => sets.create(input), (error) => error.code === 'DUPLICATE_SET');
    assert.throws(() => sets.create({ ...input, strong_card_id: animal.id }), (error) => error.code === 'WRONG_CATEGORY');
    assert.throws(() => cards.delete(animal.id), (error) => error.code === 'CARD_IN_SET');
    const another = cards.create({ category: 'miracle', nama: 'All G', rarity: 'gold', card_code: 'bn112233', image_path: image('d'), card_type: 'speed', effect: 'All G' });
    const second = sets.create({ ...input, miracle_card_id: another.id });
    assert.equal(sets.list({ search: 'Brutus' }).total, 2);
    assert.equal(sets.list({ search: 'Shining', pageSize: 1 }).items.length, 1);
    assert.equal(sets.list({ search: 'Brutus', pageSize: 1, page: 2 }).items.length, 1);
    assert.equal(sets.list({ search: '%' }).total, 0);
    assert.equal(sets.update(second.id, { ...input, strong_card_id: strong.id, miracle_card_id: another.id }).id, second.id);
    sets.delete(first.id);
    assert.throws(() => cards.delete(animal.id), (error) => error.code === 'CARD_IN_SET');
    sets.delete(second.id);
    assert.equal(cards.delete(animal.id).id, animal.id);
    assert.equal(cards.getById(strong.id).id, strong.id);
  } finally { opened.close(); }
}));

test('Card Set IPC rejects untrusted frames and malformed payloads', () => withData((dir) => {
  const opened = openDesktopDatabase(dir);
  try {
    const repository = new CardSetRepository(opened.db);
    const handlers = new Map();
    const ipcMain = { handle: (channel, handler) => handlers.set(channel, handler), removeHandler: (channel) => handlers.delete(channel) };
    const frame = { url: 'file:///trusted/index.html' };
    const contents = { mainFrame: frame };
    const unregister = registerCardSetIpc({ ipcMain, mainWindow: { webContents: contents }, repository, trustedFrameUrl: frame.url });
    const event = { sender: contents, senderFrame: frame };
    assert.deepEqual(handlers.get('card-sets:list')(event, { search: '', page: 1 }), { ok: true, data: { items: [], total: 0, page: 1, pageSize: 6 } });
    assert.equal(handlers.get('card-sets:create')(event, { animal_card_id: 1 }).code, 'INVALID_SET');
    assert.equal(handlers.get('card-sets:list')(event, { pageSize: 100000 }).code, 'INVALID_QUERY');
    assert.throws(() => handlers.get('card-sets:list')({ sender: contents, senderFrame: { url: 'file:///untrusted.html' } }, {}), /Unauthorized/);
    unregister();
    assert.equal(handlers.size, 0);
  } finally { opened.close(); }
}));
