'use strict';

const FIELDS = ['animal_card_id', 'strong_card_id', 'miracle_card_id'];
const CATEGORIES = ['animal', 'strong', 'miracle'];

class CardSetError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CardSetError';
    this.code = code;
  }
}

function validId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function requireId(value) {
  if (!validId(value)) throw new CardSetError('INVALID_ID', 'Invalid Card Set ID.');
  return value;
}

function requireCards(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))
    || Object.keys(input).length !== FIELDS.length
    || Object.keys(input).some((key) => !FIELDS.includes(key))
    || FIELDS.some((key) => !validId(input[key]))) {
    throw new CardSetError('INVALID_SET', 'Choose one Animal, Strong, and Miracle card.');
  }
  return FIELDS.map((key) => input[key]);
}

function storageError(error) {
  if (error instanceof CardSetError) return error;
  if (String(error?.message).includes('UNIQUE constraint failed: card_sets.')) {
    return new CardSetError('DUPLICATE_SET', 'This Card Set is already saved.');
  }
  if (String(error?.message).includes('FOREIGN KEY constraint failed')) {
    return new CardSetError('CARD_NOT_FOUND', 'One of these cards is no longer available. Choose another card.');
  }
  return new CardSetError('DATABASE_WRITE_FAILED', 'Could not save the Card Set.');
}

class CardSetRepository {
  constructor(db) { this.db = db; }

  transaction(work) {
    try { this.db.exec('BEGIN IMMEDIATE'); }
    catch (error) { throw storageError(error); }
    try {
      const result = work();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch { /* keep the original error */ }
      throw storageError(error);
    }
  }

  assertCategories(ids) {
    ids.forEach((id, index) => {
      const card = this.db.prepare('SELECT category FROM cards WHERE id = ?').get(id);
      if (!card) throw new CardSetError('CARD_NOT_FOUND', 'One of these cards is no longer available. Choose another card.');
      if (card.category !== CATEGORIES[index]) {
        throw new CardSetError('WRONG_CATEGORY', `Choose a ${CATEGORIES[index]} card for the ${CATEGORIES[index]} slot.`);
      }
    });
  }

  expand(row) {
    if (!row) return null;
    const card = this.db.prepare('SELECT * FROM cards WHERE id = ?');
    return {
      ...row,
      animal: card.get(row.animal_card_id),
      strong: card.get(row.strong_card_id),
      miracle: card.get(row.miracle_card_id),
    };
  }

  get(id) {
    const row = this.db.prepare('SELECT * FROM card_sets WHERE id = ?').get(requireId(id));
    return this.expand(row);
  }

  create(input) {
    const ids = requireCards(input);
    return this.transaction(() => {
      this.assertCategories(ids);
      const result = this.db.prepare('INSERT INTO card_sets (animal_card_id, strong_card_id, miracle_card_id) VALUES (?, ?, ?)').run(...ids);
      return this.get(Number(result.lastInsertRowid));
    });
  }

  update(id, input) {
    requireId(id);
    const ids = requireCards(input);
    return this.transaction(() => {
      if (!this.db.prepare('SELECT 1 FROM card_sets WHERE id = ?').get(id)) {
        throw new CardSetError('SET_NOT_FOUND', 'Card Set not found.');
      }
      this.assertCategories(ids);
      this.db.prepare(`UPDATE card_sets SET animal_card_id = ?, strong_card_id = ?, miracle_card_id = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).run(...ids, id);
      return this.get(id);
    });
  }

  delete(id) {
    requireId(id);
    return this.transaction(() => {
      const row = this.get(id);
      if (!row) throw new CardSetError('SET_NOT_FOUND', 'Card Set not found.');
      this.db.prepare('DELETE FROM card_sets WHERE id = ?').run(id);
      return row;
    });
  }

  list(options) {
    if (!options || typeof options !== 'object' || Array.isArray(options)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(options))
      || Object.keys(options).some((key) => !['search', 'page', 'pageSize'].includes(key))) {
      throw new CardSetError('INVALID_QUERY', 'Invalid Card Set search.');
    }
    const { search = '', page = 1, pageSize = 6 } = options;
    if (typeof search !== 'string' || search.length > 255 || !validId(page) || page > 1000000
      || !validId(pageSize) || pageSize > 50) {
      throw new CardSetError('INVALID_QUERY', 'Invalid Card Set search.');
    }
    const term = `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`;
    const from = `FROM card_sets AS s
      JOIN cards AS a ON a.id = s.animal_card_id
      JOIN cards AS st ON st.id = s.strong_card_id
      JOIN cards AS m ON m.id = s.miracle_card_id`;
    const where = search.trim()
      ? "WHERE a.nama LIKE ? ESCAPE '\\' COLLATE NOCASE OR st.nama LIKE ? ESCAPE '\\' COLLATE NOCASE OR m.nama LIKE ? ESCAPE '\\' COLLATE NOCASE"
      : '';
    const params = where ? [term, term, term] : [];
    const total = this.db.prepare(`SELECT count(*) AS total ${from} ${where}`).get(...params).total;
    const rows = this.db.prepare(`SELECT s.* ${from} ${where} ORDER BY s.created_at DESC, s.id DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, (page - 1) * pageSize);
    return { items: rows.map((row) => this.expand(row)), total, page, pageSize };
  }
}

module.exports = { CardSetRepository, CardSetError };
