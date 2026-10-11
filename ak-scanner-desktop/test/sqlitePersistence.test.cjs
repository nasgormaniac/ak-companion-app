'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { openDesktopDatabase, databasePath, applyMigrations, getVersion, DatabaseError } = require('../src/main/sqliteDatabase.cjs');
const { MIGRATIONS, SCHEMA_VERSION } = require('../src/main/sqliteSchema.cjs');
const { CardRepository, CardDataError } = require('../src/main/cardRepository.cjs');

const imagePath = 'a'.repeat(32) + '.png';
const animal = (code = 'bn123456') => ({
  category: 'animal', nama: 'Brutus', rarity: 'gold', card_code: code,
  image_path: imagePath, gold_attack: 'G', card_type: 'speed',
});
const strong = (code = 'bn!@#$%^') => ({
  category: 'strong', nama: 'Strong A', rarity: 'silver', card_code: code,
  image_path: 'b'.repeat(32) + '.jpg', guts_level: 1, tech_level: 2,
  power_level: 3, aura: 'burning',
});
const miracle = (code = 'bnABCDEF') => ({
  category: 'miracle', nama: 'Miracle A', rarity: 'bronze', card_code: code,
  image_path: 'c'.repeat(32) + '.png', card_type: 'multi', effect: 'Slot Jammer',
});

function withUserData(work) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-desktop-db-test-'));
  try { return work(dir); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('fresh database starts empty with desktop cards and sets and reopens at current version', () => withUserData((dir) => {
  let opened = openDesktopDatabase(dir);
  try {
    assert.equal(getVersion(opened.db), SCHEMA_VERSION);
    assert.equal(opened.db.prepare('SELECT count(*) AS n FROM cards').get().n, 0);
    assert.equal(opened.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    assert.deepEqual(opened.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map((row) => row.name), ['cards', 'card_sets']);
    assert.equal(opened.preUpgradeBackup, null);
  } finally { opened.close(); }
  opened = openDesktopDatabase(dir);
  try { assert.equal(opened.preUpgradeBackup, null); }
  finally { opened.close(); }
}));

test('an interrupted first launch with an empty version-zero file can initialize safely', () => withUserData((dir) => {
  fs.mkdirSync(path.dirname(databasePath(dir)), { recursive: true });
  new DatabaseSync(databasePath(dir)).close();
  const opened = openDesktopDatabase(dir);
  try {
    assert.equal(getVersion(opened.db), SCHEMA_VERSION);
    assert.equal(new CardRepository(opened.db).list({ category: 'animal' }).total, 0);
    assert.ok(opened.preUpgradeBackup);
  } finally { opened.close(); }
}));

test('repository creates, updates, filters, sorts, deletes, and reads a stored code by ID', () => withUserData((dir) => {
  const opened = openDesktopDatabase(dir);
  try {
    const cards = new CardRepository(opened.db);
    const a = cards.create(animal());
    const s = cards.create(strong());
    const m = cards.create(miracle());
    assert.equal(cards.getStoredCode(s.id), 'bn!@#$%^');
    assert.equal(cards.getStoredCode(999), null);
    assert.equal(cards.list({ category: 'animal', search: 'bru' }).total, 1);
    assert.equal(cards.list({ category: 'strong', filters: { aura: 'burning', tech_level: 2 } }).total, 1);
    assert.equal(cards.list({ category: 'miracle', filters: { effect: 'Slot Jammer', type: 'multi' } }).total, 1);
    assert.equal(cards.list({ category: 'animal', search: '%' }).total, 0);
    assert.throws(() => cards.list({ category: 'animal', pageSize: 1000 }), (error) => error.code === 'INVALID_QUERY');
    assert.throws(() => cards.list({ category: 'animal', filters: { 'rarity OR 1=1': 'gold' } }), (error) => error.code === 'INVALID_QUERY');
    cards.create({ ...animal('bn654321'), nama: 'Common Animal', rarity: 'common' });
    assert.deepEqual(cards.list({ category: 'animal', raritySort: 'asc' }).items.map((row) => row.rarity), ['common', 'gold']);
    const updated = cards.update(a.id, { nama: 'Brutus Updated', card_code: 'bn12!?AB' });
    assert.equal(updated.nama, 'Brutus Updated');
    assert.equal(cards.getStoredCode(a.id), 'bn12!?AB');
    assert.equal(cards.delete(m.id).id, m.id);
    assert.equal(cards.getById(m.id), null);
  } finally { opened.close(); }
}));

test('global code uniqueness and failed update preserve existing rows', () => withUserData((dir) => {
  const opened = openDesktopDatabase(dir);
  try {
    const cards = new CardRepository(opened.db);
    const a = cards.create(animal());
    const s = cards.create(strong());
    assert.throws(() => cards.create(miracle('bn123456')), (error) => error instanceof CardDataError && error.code === 'DUPLICATE_CODE');
    assert.throws(() => cards.update(s.id, { card_code: a.card_code }), (error) => error.code === 'DUPLICATE_CODE');
    assert.equal(cards.getStoredCode(s.id), 'bn!@#$%^');
    assert.equal(opened.db.prepare('SELECT count(*) AS n FROM cards').get().n, 2);
  } finally { opened.close(); }
}));

test('validation and SQLite CHECK constraints reject invalid category data and codes', () => withUserData((dir) => {
  const opened = openDesktopDatabase(dir);
  try {
    const cards = new CardRepository(opened.db);
    assert.throws(() => cards.create({ ...animal(), card_code: 'bn12 456' }), (error) => error.code === 'INVALID_CARD' && !!error.fieldErrors.card_code);
    assert.throws(() => cards.create({ ...animal(), image_path: '../outside.png' }), (error) => error.code === 'INVALID_CARD' && !!error.fieldErrors.image_path);
    assert.throws(() => cards.create({ ...animal(), effect: 'All Big' }), (error) => error.code === 'INVALID_CARD' && !!error.fieldErrors.effect);
    assert.throws(() => cards.create({ ...miracle(), effect: 'unknown' }), (error) => error.code === 'INVALID_CARD' && !!error.fieldErrors.effect);
    const a = cards.create(animal());
    assert.throws(() => opened.db.prepare('UPDATE cards SET card_code = ? WHERE id = ?').run('bad', a.id), /CHECK constraint/);
    assert.throws(() => opened.db.prepare('UPDATE cards SET guts_level = 2 WHERE id = ?').run(a.id), /CHECK constraint/);
    assert.equal(cards.getStoredCode(a.id), 'bn123456');
  } finally { opened.close(); }
}));

test('transaction rolls back all writes when a later statement fails', () => withUserData((dir) => {
  const opened = openDesktopDatabase(dir);
  try {
    const cards = new CardRepository(opened.db);
    assert.throws(() => cards.transaction(() => {
      opened.db.prepare(`INSERT INTO cards(category,nama,rarity,card_code,image_path,gold_attack,card_type)
        VALUES ('animal','First','common','bn123456',?,'G','speed')`).run(imagePath);
      opened.db.prepare(`INSERT INTO cards(category,nama,rarity,card_code,image_path,gold_attack,card_type)
        VALUES ('animal','Second','common','bn123456',?,'G','speed')`).run(imagePath);
    }), (error) => error.code === 'DUPLICATE_CODE');
    assert.equal(cards.list({ category: 'animal' }).total, 0);
  } finally { opened.close(); }
}));

test('version 1 desktop database is backed up and migrated without losing cards or images', () => withUserData((dir) => {
  fs.mkdirSync(path.dirname(databasePath(dir)), { recursive: true });
  const old = new DatabaseSync(databasePath(dir));
  old.exec(MIGRATIONS[0].sql);
  old.exec('PRAGMA user_version = 1');
  old.prepare(`INSERT INTO cards(category,nama,rarity,card_code,image_path,gold_attack,card_type)
    VALUES ('animal','Existing','common','bn123456',?,'G','speed')`).run(imagePath);
  old.close();
  fs.mkdirSync(path.join(dir, 'images'));
  fs.writeFileSync(path.join(dir, 'images', imagePath), 'image bytes');

  const opened = openDesktopDatabase(dir);
  try {
    assert.equal(getVersion(opened.db), SCHEMA_VERSION);
    assert.equal(new CardRepository(opened.db).list({ category: 'animal' }).total, 1);
    assert.ok(opened.preUpgradeBackup);
    assert.equal(fs.readFileSync(path.join(opened.preUpgradeBackup, 'images', imagePath), 'utf8'), 'image bytes');
    const backup = new DatabaseSync(path.join(opened.preUpgradeBackup, 'ak-scanner.sqlite'), { readOnly: true });
    assert.equal(getVersion(backup), 1);
    assert.equal(backup.prepare('SELECT count(*) AS n FROM cards').get().n, 1);
    backup.close();
  } finally { opened.close(); }
}));

test('failed migration rolls back schema and version together', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.throws(() => applyMigrations(db, 0, [
      { version: 1, sql: 'CREATE TABLE temporary_card (id INTEGER PRIMARY KEY);' },
      { version: 2, sql: 'CREATE TABLE broken (' },
    ]), (error) => error instanceof DatabaseError && error.code === 'MIGRATION_FAILED');
    assert.equal(getVersion(db), 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name = 'temporary_card'").get().n, 0);
  } finally { db.close(); }
});

test('unknown or newer database schema is not overwritten', () => withUserData((dir) => {
  fs.mkdirSync(path.dirname(databasePath(dir)), { recursive: true });
  let db = new DatabaseSync(databasePath(dir));
  db.exec('CREATE TABLE other_data(value TEXT);');
  db.close();
  assert.throws(() => openDesktopDatabase(dir), (error) => error.code === 'UNRECOGNIZED_DATABASE');
  db = new DatabaseSync(databasePath(dir));
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='other_data'").get());
  db.exec('PRAGMA user_version = 999');
  db.close();
  assert.throws(() => openDesktopDatabase(dir), (error) => error.code === 'UNSUPPORTED_SCHEMA_VERSION');
}));

test('manual backup preserves the current database and owned images', () => withUserData((dir) => {
  const opened = openDesktopDatabase(dir);
  try {
    const cards = new CardRepository(opened.db);
    cards.create(animal());
    fs.writeFileSync(path.join(dir, 'images', imagePath), 'card image bytes');
    const backupPath = opened.backup();
    assert.equal(fs.readFileSync(path.join(backupPath, 'images', imagePath), 'utf8'), 'card image bytes');
    const manifest = JSON.parse(fs.readFileSync(path.join(backupPath, 'manifest.json'), 'utf8'));
    assert.equal(manifest.reason, 'manual');
    assert.equal(manifest.schemaVersion, SCHEMA_VERSION);
    const snapshot = new DatabaseSync(path.join(backupPath, 'ak-scanner.sqlite'), { readOnly: true });
    try { assert.equal(snapshot.prepare('SELECT count(*) AS total FROM cards').get().total, 1); }
    finally { snapshot.close(); }
  } finally { opened.close(); }
}));

test('closed SQLite connection reports read/write failure without losing saved cards', () => withUserData((dir) => {
  let opened = openDesktopDatabase(dir);
  const cards = new CardRepository(opened.db);
  cards.create(animal());
  opened.close();
  assert.throws(() => cards.list({ category: 'animal' }));
  assert.throws(() => cards.create(strong()), (error) => error.code === 'DATABASE_WRITE_FAILED');
  opened = openDesktopDatabase(dir);
  try { assert.equal(new CardRepository(opened.db).list({ category: 'animal' }).total, 1); }
  finally { opened.close(); }
}));
