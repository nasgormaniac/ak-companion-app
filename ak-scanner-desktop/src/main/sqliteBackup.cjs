'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

function backupDesktopData(db, userDataPath, reason = 'manual') {
  if (!['manual', 'pre-upgrade'].includes(reason)) throw new TypeError('Invalid backup reason');
  const root = path.join(userDataPath, 'backups');
  fs.mkdirSync(root, { recursive: true });
  const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${reason}-${randomUUID()}`;
  const pending = path.join(root, `${name}.partial`);
  const complete = path.join(root, name);
  fs.mkdirSync(pending);
  try {
    const backupPath = path.join(pending, 'ak-scanner.sqlite');
    // VACUUM INTO creates a consistent SQLite snapshot, including when the source uses WAL.
    // It is available in the Node 23 test runtime as well as Electron's Node 24 runtime.
    db.prepare('VACUUM INTO ?').run(backupPath);
    const imagesSource = path.join(userDataPath, 'images');
    const imagesDestination = path.join(pending, 'images');
    if (fs.existsSync(imagesSource)) fs.cpSync(imagesSource, imagesDestination, { recursive: true });
    else fs.mkdirSync(imagesDestination);

    const verification = new DatabaseSync(backupPath, { readOnly: true });
    let version;
    try {
      if (verification.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') {
        throw new Error('Backup integrity check failed');
      }
      version = verification.prepare('PRAGMA user_version').get().user_version;
    } finally {
      verification.close();
    }
    fs.writeFileSync(path.join(pending, 'manifest.json'), JSON.stringify({
      createdAt: new Date().toISOString(),
      reason,
      schemaVersion: version,
    }, null, 2), { flag: 'wx' });
    fs.renameSync(pending, complete);
    return complete;
  } catch (error) {
    fs.rmSync(pending, { recursive: true, force: true });
    throw error;
  }
}

module.exports = { backupDesktopData };
