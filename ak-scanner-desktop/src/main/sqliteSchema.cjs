'use strict';

const SCHEMA_VERSION = 2;

const MIGRATIONS = Object.freeze([
  {
    version: 1,
    name: 'create_cards',
    sql: `
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY,
        category TEXT NOT NULL CHECK (category IN ('animal', 'strong', 'miracle')),
        nama TEXT NOT NULL CHECK (length(trim(nama)) BETWEEN 1 AND 255),
        rarity TEXT NOT NULL,
        card_code TEXT NOT NULL UNIQUE
          CHECK (length(CAST(card_code AS BLOB)) = 8
            AND card_code GLOB 'bn[!-~][!-~][!-~][!-~][!-~][!-~]'),
        image_path TEXT NOT NULL
          CHECK (length(image_path) BETWEEN 36 AND 40
            AND instr(image_path, '/') = 0
            AND instr(image_path, char(92)) = 0),
        gold_attack TEXT,
        card_type TEXT,
        guts_level INTEGER,
        tech_level INTEGER,
        power_level INTEGER,
        aura TEXT,
        effect TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        CHECK (
          (category = 'animal'
            AND rarity IN ('common', 'bronze', 'silver', 'gold', 'ultra', 'kaiser')
            AND gold_attack IN ('G', 'T', 'P')
            AND card_type IN ('speed', 'multi', 'heavy')
            AND guts_level IS NULL AND tech_level IS NULL AND power_level IS NULL
            AND aura IS NULL AND effect IS NULL)
          OR
          (category = 'strong'
            AND rarity IN ('common', 'bronze', 'silver', 'gold')
            AND gold_attack IS NULL AND card_type IS NULL
            AND guts_level BETWEEN 1 AND 5
            AND tech_level BETWEEN 1 AND 5
            AND power_level BETWEEN 1 AND 5
            AND aura IN ('none', 'shining', 'defense', 'burning', 'evil', 'forest', 'miracle')
            AND effect IS NULL)
          OR
          (category = 'miracle'
            AND rarity IN ('common', 'bronze', 'silver', 'gold')
            AND gold_attack IS NULL
            AND card_type IN ('speed', 'multi', 'heavy')
            AND guts_level IS NULL AND tech_level IS NULL AND power_level IS NULL
            AND aura IS NULL
            AND effect IN ('None', 'Slot Jammer', 'All Big', 'All Doubling',
              'All Miracle', 'Lucky Chance', 'Lucky Break', 'All G', 'All T',
              'All P', 'Resurrection', 'G Guard', 'T Guard', 'P Guard',
              'Mystery Miracle'))
        )
      );
      CREATE INDEX cards_category_created_idx ON cards(category, created_at DESC, id DESC);
    `,
  },
  {
    version: 2,
    name: 'index_rarity_filters',
    sql: `CREATE INDEX cards_category_rarity_idx ON cards(category, rarity);`,
  },
]);

module.exports = { SCHEMA_VERSION, MIGRATIONS };
