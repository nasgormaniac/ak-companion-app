'use strict';

const { isValidManualCode } = require('./gameProtocol.cjs');

const CATEGORIES = Object.freeze(['animal', 'strong', 'miracle']);
const RARITIES = Object.freeze(['common', 'bronze', 'silver', 'gold', 'ultra', 'kaiser']);
const TYPES = Object.freeze(['speed', 'multi', 'heavy']);
const AURAS = Object.freeze(['none', 'shining', 'defense', 'burning', 'evil', 'forest', 'miracle']);
const EFFECTS = Object.freeze([
  'None', 'Slot Jammer', 'All Big', 'All Doubling', 'All Miracle',
  'Lucky Chance', 'Lucky Break', 'All G', 'All T', 'All P',
  'Resurrection', 'G Guard', 'T Guard', 'P Guard', 'Mystery Miracle',
]);
const DATA_FIELDS = Object.freeze([
  'category', 'nama', 'rarity', 'card_code', 'image_path', 'gold_attack',
  'card_type', 'guts_level', 'tech_level', 'power_level', 'aura', 'effect',
]);
const MUTABLE_FIELDS = new Set(DATA_FIELDS.filter((field) => field !== 'category'));
const IMAGE_NAME_PATTERN = /^[a-f0-9]{32}\.(?:jpg|png)$/;

class CardDataError extends Error {
  constructor(code, message, fieldErrors = {}) {
    super(message);
    this.name = 'CardDataError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function requireId(id) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new CardDataError('INVALID_ID', 'Invalid card ID.', { id: 'ID must be a positive integer.' });
  }
  return id;
}

function normalizeCard(input, current = null) {
  if (!isPlainObject(input)) throw new CardDataError('INVALID_CARD', 'Card data must be an object.');
  const errors = {};
  const allowed = current ? MUTABLE_FIELDS : new Set(DATA_FIELDS);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) errors[key] = 'Unknown field or field cannot be changed.';
  }
  const card = Object.fromEntries(DATA_FIELDS.map((field) => [field, current ? current[field] : null]));
  for (const key of Object.keys(input)) {
    if (allowed.has(key)) card[key] = input[key];
  }

  if (!CATEGORIES.includes(card.category)) errors.category = 'Choose Animal, Strong, or Miracle.';
  if (typeof card.nama !== 'string' || card.nama.trim().length < 1 || [...card.nama.trim()].length > 255) {
    errors.nama = 'Card name is required and must be at most 255 characters.';
  } else card.nama = card.nama.trim();
  if (!isValidManualCode(card.card_code)) errors.card_code = 'Card code must be exactly 8 printable characters starting with bn.';
  if (typeof card.image_path !== 'string' || !IMAGE_NAME_PATTERN.test(card.image_path)) {
    errors.image_path = 'Choose a valid JPEG or PNG card image.';
  }
  const validRarities = card.category === 'animal' ? RARITIES : RARITIES.slice(0, 4);
  if (!validRarities.includes(card.rarity)) errors.rarity = 'Rarity is not valid for this category.';

  const allowedByCategory = {
    animal: new Set(['gold_attack', 'card_type']),
    strong: new Set(['guts_level', 'tech_level', 'power_level', 'aura']),
    miracle: new Set(['card_type', 'effect']),
  };
  for (const field of ['gold_attack', 'card_type', 'guts_level', 'tech_level', 'power_level', 'aura', 'effect']) {
    if (!allowedByCategory[card.category]?.has(field) && card[field] !== null) {
      errors[field] = 'This field does not apply to this card category.';
    }
  }
  if (card.category === 'animal') {
    if (!['G', 'T', 'P'].includes(card.gold_attack)) errors.gold_attack = 'Gold Attack must be G, T, or P.';
    if (!TYPES.includes(card.card_type)) errors.card_type = 'Invalid Animal type.';
  }
  if (card.category === 'strong') {
    for (const field of ['guts_level', 'tech_level', 'power_level']) {
      const value = card[field];
      if (!(Number.isInteger(value) && value >= 1 && value <= 5) && !(typeof value === 'string' && /^[1-5]$/.test(value))) {
        errors[field] = 'Level must be a number from 1 to 5.';
      } else card[field] = Number(value);
    }
    if (!AURAS.includes(card.aura)) errors.aura = 'Invalid Strong aura.';
  }
  if (card.category === 'miracle') {
    if (!TYPES.includes(card.card_type)) errors.card_type = 'Invalid Miracle type.';
    if (!EFFECTS.includes(card.effect)) errors.effect = 'Invalid Miracle effect.';
  }
  if (Object.keys(errors).length) throw new CardDataError('INVALID_CARD', 'Check the card details.', errors);
  return card;
}

function translateStorageError(error) {
  if (error instanceof CardDataError) return error;
  if (typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed: cards.card_code')) {
    return new CardDataError('DUPLICATE_CODE', 'This card code is already used by another card.', { card_code: 'Card code must be unique.' });
  }
  if (typeof error?.message === 'string' && error.message.includes('CHECK constraint failed')) {
    return new CardDataError('INTEGRITY_ERROR', 'Card data violates a database rule.');
  }
  return new CardDataError('DATABASE_WRITE_FAILED', 'Could not save the card to the local database.');
}

class CardRepository {
  constructor(db) {
    this.db = db;
  }

  transaction(work) {
    try { this.db.exec('BEGIN IMMEDIATE'); }
    catch (error) { throw translateStorageError(error); }
    try {
      const result = work();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch { /* preserve the original error */ }
      throw translateStorageError(error);
    }
  }

  getById(id) {
    return this.db.prepare('SELECT * FROM cards WHERE id = ?').get(requireId(id)) ?? null;
  }

  getStoredCode(id) {
    const row = this.db.prepare('SELECT card_code FROM cards WHERE id = ?').get(requireId(id));
    return row?.card_code ?? null;
  }

  hasImage(name) {
    return Boolean(this.db.prepare('SELECT 1 FROM cards WHERE image_path = ? LIMIT 1').get(name));
  }

  create(input) {
    const card = normalizeCard(input);
    return this.transaction(() => {
      const result = this.db.prepare(`
        INSERT INTO cards (category, nama, rarity, card_code, image_path, gold_attack,
          card_type, guts_level, tech_level, power_level, aura, effect)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...DATA_FIELDS.map((field) => card[field]));
      return this.getById(Number(result.lastInsertRowid));
    });
  }

  update(id, changes) {
    requireId(id);
    return this.transaction(() => {
      const current = this.getById(id);
      if (!current) throw new CardDataError('CARD_NOT_FOUND', 'Card not found.');
      const card = normalizeCard(changes, current);
      this.db.prepare(`
        UPDATE cards SET nama = ?, rarity = ?, card_code = ?, image_path = ?,
          gold_attack = ?, card_type = ?, guts_level = ?, tech_level = ?,
          power_level = ?, aura = ?, effect = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `).run(...DATA_FIELDS.slice(1).map((field) => card[field]), id);
      return this.getById(id);
    });
  }

  delete(id) {
    requireId(id);
    return this.transaction(() => {
      const current = this.getById(id);
      if (!current) throw new CardDataError('CARD_NOT_FOUND', 'Card not found.');
      this.db.prepare('DELETE FROM cards WHERE id = ?').run(id);
      return current;
    });
  }

  list(options) {
    if (!isPlainObject(options)) throw new CardDataError('INVALID_QUERY', 'Invalid card list options.');
    for (const key of Object.keys(options)) {
      if (!['category', 'search', 'filters', 'raritySort', 'page', 'pageSize'].includes(key)) {
        throw new CardDataError('INVALID_QUERY', 'Invalid card list options.');
      }
    }
    const { category, search = '', filters = {}, raritySort = null, page = 1, pageSize = 6 } = options;
    if (!CATEGORIES.includes(category) || typeof search !== 'string' || search.length > 255
      || !isPlainObject(filters) || ![null, 'asc', 'desc'].includes(raritySort)
      || !Number.isSafeInteger(page) || page < 1 || page > 1000000
      || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      throw new CardDataError('INVALID_QUERY', 'Invalid card list options.');
    }
    const columns = {
      animal: { rarity: RARITIES, gold_attack: ['G', 'T', 'P'], type: TYPES },
      strong: { rarity: RARITIES.slice(0, 4), guts_level: [1, 2, 3, 4, 5], tech_level: [1, 2, 3, 4, 5], power_level: [1, 2, 3, 4, 5], aura: AURAS },
      miracle: { rarity: RARITIES.slice(0, 4), effect: EFFECTS, type: TYPES },
    }[category];
    const clauses = ['category = ?'];
    const values = [category];
    if (search) {
      clauses.push("nama LIKE ? ESCAPE '\\' COLLATE NOCASE");
      values.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    }
    for (const [key, value] of Object.entries(filters)) {
      const allowed = columns[key];
      if (!allowed || !allowed.includes(value)) throw new CardDataError('INVALID_QUERY', 'Invalid card filter.');
      clauses.push(`${key === 'type' ? 'card_type' : key} = ?`);
      values.push(value);
    }
    const where = clauses.join(' AND ');
    const total = this.db.prepare(`SELECT count(*) AS total FROM cards WHERE ${where}`).get(...values).total;
    const rarityOrder = "CASE rarity WHEN 'common' THEN 1 WHEN 'bronze' THEN 2 WHEN 'silver' THEN 3 WHEN 'gold' THEN 4 WHEN 'ultra' THEN 5 WHEN 'kaiser' THEN 6 END";
    const order = raritySort ? `${rarityOrder} ${raritySort.toUpperCase()}, created_at DESC, id DESC` : 'created_at DESC, id DESC';
    const items = this.db.prepare(`SELECT * FROM cards WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .all(...values, pageSize, (page - 1) * pageSize);
    return { items, total, page, pageSize };
  }
}

module.exports = {
  CardRepository,
  CardDataError,
  normalizeCard,
  CATEGORIES,
  RARITIES,
  TYPES,
  AURAS,
  EFFECTS,
};
