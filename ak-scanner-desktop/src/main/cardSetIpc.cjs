'use strict';

const { CardSetError } = require('./cardSetRepository.cjs');

const CHANNELS = ['card-sets:list', 'card-sets:get', 'card-sets:create', 'card-sets:update', 'card-sets:delete'];

function registerCardSetIpc({ ipcMain, mainWindow, repository, trustedFrameUrl }) {
  function authorize(event) {
    if (!event.senderFrame || event.sender !== mainWindow.webContents
      || event.senderFrame !== mainWindow.webContents.mainFrame
      || event.senderFrame.url !== trustedFrameUrl) {
      throw new Error('Unauthorized Card Set IPC sender');
    }
  }
  function handle(channel, argCount, work) {
    ipcMain.handle(channel, (event, ...args) => {
      authorize(event);
      try {
        if (args.length !== argCount) throw new CardSetError('INVALID_PAYLOAD', 'Invalid Card Set request.');
        return { ok: true, data: work(...args) };
      } catch (error) {
        return error instanceof CardSetError
          ? { ok: false, code: error.code, message: error.message }
          : { ok: false, code: 'STORAGE_ERROR', message: 'Could not access Card Sets.' };
      }
    });
  }
  handle('card-sets:list', 1, (options) => repository.list(options));
  handle('card-sets:get', 1, (id) => {
    const set = repository.get(id);
    if (!set) throw new CardSetError('SET_NOT_FOUND', 'Card Set not found.');
    return set;
  });
  handle('card-sets:create', 1, (input) => repository.create(input));
  handle('card-sets:update', 2, (id, input) => repository.update(id, input));
  handle('card-sets:delete', 1, (id) => repository.delete(id));
  return () => CHANNELS.forEach((channel) => ipcMain.removeHandler(channel));
}

module.exports = { registerCardSetIpc };
