'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDesktopDatabase } = require('../src/main/sqliteDatabase.cjs');
const { CardRepository } = require('../src/main/cardRepository.cjs');

const image = 'a'.repeat(32) + '.png';
const animal = (code, goldAttack = 'G', type = 'speed') => ({ category: 'animal', nama: code, rarity: 'gold', card_code: code, image_path: image, gold_attack: goldAttack, card_type: type });
const strong = (code, levels = [1, 1, 1]) => ({ category: 'strong', nama: code, rarity: 'silver', card_code: code, image_path: image, guts_level: levels[0], tech_level: levels[1], power_level: levels[2], aura: 'shining' });
const miracle = (code, type = 'speed') => ({ category: 'miracle', nama: code, rarity: 'bronze', card_code: code, image_path: image, card_type: type, effect: 'Slot Jammer' });

function withCards(work) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-random-picks-'));
  const opened = openDesktopDatabase(root);
  try { work(new CardRepository(opened.db)); }
  finally { opened.close(); fs.rmSync(root, { recursive: true, force: true }); }
}

test('random picks use the whole category and require a complete trio', () => withCards((repo) => {
  assert.equal(repo.random('animal'), null);
  assert.deepEqual(repo.pickTrio('random'), { cards: null, missing: ['animal', 'strong', 'miracle'], fallback: false });
  const a = repo.create(animal('bnA00001'));
  repo.create(strong('bnS00001'));
  repo.create(miracle('bnM00001'));
  assert.equal(repo.list({ category: 'animal', search: 'no match' }).total, 0);
  assert.equal(repo.random('animal').id, a.id);
  assert.equal(repo.pickTrio('random').cards.animal.id, a.id);
  assert.throws(() => repo.random('other'), (error) => error.code === 'INVALID_QUERY');
  assert.throws(() => repo.pickTrio('best', { animal: 0 }), (error) => error.code === 'INVALID_QUERY');
}));

test('Best Random follows Gold Attack level 5 and Animal type, then falls back to ordinary random', () => withCards((repo) => {
  repo.create(animal('bnA00001', 'T', 'multi'));
  const match = repo.create(strong('bnS00001', [1, 5, 2]));
  repo.create(strong('bnS00002', [5, 2, 5]));
  const matchingMiracle = repo.create(miracle('bnM00001', 'multi'));
  repo.create(miracle('bnM00002', 'speed'));
  const best = repo.pickTrio('best');
  assert.equal(best.fallback, false);
  assert.equal(best.cards.strong.id, match.id);
  assert.equal(best.cards.miracle.id, matchingMiracle.id);
  repo.delete(match.id);
  const fallback = repo.pickTrio('best');
  assert.equal(fallback.fallback, true);
  assert.ok(fallback.cards.animal && fallback.cards.strong && fallback.cards.miracle);
}));

test('repeated random picks avoid an identical trio when another card exists', () => withCards((repo) => {
  repo.create(animal('bnA00001'));
  repo.create(animal('bnA00002'));
  repo.create(strong('bnS00001'));
  repo.create(miracle('bnM00001'));
  const first = repo.pickTrio('random').cards;
  const previous = Object.fromEntries(['animal', 'strong', 'miracle'].map((category) => [category, first[category].id]));
  const second = repo.pickTrio('random', previous).cards;
  assert.notEqual(second.animal.id, first.animal.id);
}));

test('repeated Best Random stays compatible while avoiding an identical trio', () => withCards((repo) => {
  repo.create(animal('bnA00001', 'G', 'speed'));
  repo.create(animal('bnA00002', 'G', 'speed'));
  repo.create(strong('bnS00001', [5, 1, 1]));
  repo.create(miracle('bnM00001', 'speed'));
  const first = repo.pickTrio('best').cards;
  const previous = Object.fromEntries(['animal', 'strong', 'miracle'].map((category) => [category, first[category].id]));
  const second = repo.pickTrio('best', previous);
  assert.equal(second.fallback, false);
  assert.notEqual(second.cards.animal.id, first.animal.id);
  assert.equal(second.cards.strong.guts_level, 5);
  assert.equal(second.cards.miracle.card_type, second.cards.animal.card_type);
}));

test('Best Random uses Power level when Animal Gold Attack is P', () => withCards((repo) => {
  repo.create(animal('bnA00001', 'P', 'heavy'));
  repo.create(strong('bnS00001', [5, 5, 2]));
  const powerMatch = repo.create(strong('bnS00002', [1, 1, 5]));
  repo.create(miracle('bnM00001', 'heavy'));
  const picked = repo.pickTrio('best');
  assert.equal(picked.fallback, false);
  assert.equal(picked.cards.strong.id, powerMatch.id);
  assert.equal(picked.cards.miracle.card_type, 'heavy');
}));
