'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_GAME_PORT, isValidPort } = require('./gameProtocol.cjs');

function settingsPath(userDataPath) {
  return path.join(userDataPath, 'data', 'game-settings.json');
}

function readGameSettings(userDataPath) {
  try {
    const contents = JSON.parse(fs.readFileSync(settingsPath(userDataPath), 'utf8'));
    if (!contents || !isValidPort(contents.port)) {
      return { port: DEFAULT_GAME_PORT, warning: 'Invalid port setting; using default port 9876.' };
    }
    return { port: contents.port, warning: null };
  } catch (error) {
    if (error && error.code === 'ENOENT') return { port: DEFAULT_GAME_PORT, warning: null };
    return { port: DEFAULT_GAME_PORT, warning: 'Could not read game settings; using default port 9876.' };
  }
}

function writeGameSettings(userDataPath, port) {
  if (!isValidPort(port)) throw new TypeError('Invalid game port');
  const destination = settingsPath(userDataPath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify({ port }), { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(temporary, destination);
  } catch (error) {
    try { fs.unlinkSync(temporary); } catch { /* the temporary file may not exist */ }
    throw error;
  }
}

module.exports = { readGameSettings, writeGameSettings, settingsPath };
