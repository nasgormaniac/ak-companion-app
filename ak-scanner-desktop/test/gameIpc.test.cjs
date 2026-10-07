'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CHANNELS, registerGameIpc } = require('../src/main/gameIpc.cjs');

test('IPC validates sender and card IDs, and resolves saved code in main', async () => {
  const handlers = new Map();
  const ipcMain = {
    handle: (name, handler) => handlers.set(name, handler),
    removeHandler: (name) => handlers.delete(name),
  };
  const mainFrame = { url: 'file:///app/index.html' };
  const webContents = { mainFrame };
  const mainWindow = { webContents };
  const event = { sender: webContents, senderFrame: mainFrame };
  let savedCode;
  const gameService = {
    getStatus: () => ({ state: 'DISCONNECTED', port: 9876 }),
    setPort: (port) => ({ ok: true, port }),
    sendManual: (code) => ({ ok: true, code }),
    sendStoredCode: (code) => { savedCode = code; return { ok: true }; },
  };
  const unregister = registerGameIpc({
    ipcMain, mainWindow, gameService, writeSettings: () => {},
    lookupSavedCardCode: async (id) => id === 4 ? 'legacy!' : null,
    trustedFrameUrl: mainFrame.url,
  });
  assert.throws(() => handlers.get(CHANNELS.status)({ sender: {}, senderFrame: mainFrame }), /Unauthorized/);
  assert.throws(() => handlers.get(CHANNELS.status)({ sender: webContents, senderFrame: { url: mainFrame.url } }), /Unauthorized/);
  assert.throws(() => handlers.get(CHANNELS.status)(event, 'unexpected'), /Invalid game status request/);
  assert.equal(handlers.get(CHANNELS.setPort)(event, 9876, 'extra').code, 'INVALID_CONFIGURATION');
  assert.equal(handlers.get(CHANNELS.sendManual)(event, 'bn123456', 'extra').code, 'INVALID_CODE');
  assert.equal((await handlers.get(CHANNELS.sendSaved)(event, 4, 'extra')).code, 'CARD_NOT_FOUND');
  assert.equal((await handlers.get(CHANNELS.sendSaved)(event, '4')).code, 'CARD_NOT_FOUND');
  assert.equal((await handlers.get(CHANNELS.sendSaved)(event, 5)).code, 'CARD_NOT_FOUND');
  assert.equal((await handlers.get(CHANNELS.sendSaved)(event, 4)).ok, true);
  assert.equal(savedCode, 'legacy!');
  unregister();
  assert.equal(handlers.size, 0);
});
