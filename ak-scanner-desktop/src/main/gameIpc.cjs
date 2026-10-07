'use strict';

const { isValidPort, messageForFailure } = require('./gameProtocol.cjs');

const CHANNELS = Object.freeze({
  status: 'game:status',
  setPort: 'game:set-port',
  sendManual: 'game:send-manual',
  sendSaved: 'game:send-saved',
});

function registerGameIpc({ ipcMain, mainWindow, gameService, writeSettings, lookupSavedCardCode = null, trustedFrameUrl }) {
  function authorize(event) {
    if (!event.senderFrame || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame || event.senderFrame.url !== trustedFrameUrl) {
      throw new Error('Unauthorized game IPC sender');
    }
  }

  ipcMain.handle(CHANNELS.status, (event, ...args) => {
    authorize(event);
    if (args.length) throw new Error('Invalid game status request');
    return gameService.getStatus();
  });

  ipcMain.handle(CHANNELS.setPort, (event, ...args) => {
    authorize(event);
    if (args.length !== 1) return { ok: false, code: 'INVALID_CONFIGURATION', message: messageForFailure('INVALID_CONFIGURATION'), status: gameService.getStatus() };
    const [port] = args;
    if (!isValidPort(port)) return gameService.setPort(port);
    if (gameService.sending) {
      return { ok: false, code: 'SEND_IN_PROGRESS', message: messageForFailure('SEND_IN_PROGRESS'), status: gameService.getStatus() };
    }
    try {
      writeSettings(port);
      return gameService.setPort(port);
    } catch {
      return { ok: false, code: 'SETTINGS_WRITE_FAILED', message: 'Could not save the port. Check the app storage permissions.', status: gameService.getStatus() };
    }
  });

  ipcMain.handle(CHANNELS.sendManual, (event, ...args) => {
    authorize(event);
    if (args.length !== 1) return { ok: false, code: 'INVALID_CODE', message: messageForFailure('INVALID_CODE'), status: gameService.getStatus() };
    const [code] = args;
    return gameService.sendManual(code);
  });

  ipcMain.handle(CHANNELS.sendSaved, async (event, ...args) => {
    authorize(event);
    if (args.length !== 1) return { ok: false, code: 'CARD_NOT_FOUND', message: messageForFailure('CARD_NOT_FOUND'), status: gameService.getStatus() };
    const [cardId] = args;
    if (!Number.isSafeInteger(cardId) || cardId < 1) {
      return { ok: false, code: 'CARD_NOT_FOUND', message: messageForFailure('CARD_NOT_FOUND'), status: gameService.getStatus() };
    }
    if (!lookupSavedCardCode) {
      return { ok: false, code: 'CARD_STORE_NOT_READY', message: messageForFailure('CARD_STORE_NOT_READY'), status: gameService.getStatus() };
    }
    let code;
    try {
      code = await lookupSavedCardCode(cardId);
    } catch {
      return { ok: false, code: 'CARD_LOOKUP_FAILED', message: 'Could not read the card from the local database.', status: gameService.getStatus() };
    }
    if (typeof code !== 'string') {
      return { ok: false, code: 'CARD_NOT_FOUND', message: messageForFailure('CARD_NOT_FOUND'), status: gameService.getStatus() };
    }
    return gameService.sendStoredCode(code);
  });

  return () => Object.values(CHANNELS).forEach((channel) => ipcMain.removeHandler(channel));
}

module.exports = { CHANNELS, registerGameIpc };
