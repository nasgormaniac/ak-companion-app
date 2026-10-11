'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('akScannerGame', {
  getStatus: () => ipcRenderer.invoke('game:status'),
  setPort: (port) => ipcRenderer.invoke('game:set-port', port),
  sendManual: (code) => ipcRenderer.invoke('game:send-manual', code),
  sendSaved: (cardId) => ipcRenderer.invoke('game:send-saved', cardId),
});

contextBridge.exposeInMainWorld('akScannerCards', {
  list: (options) => ipcRenderer.invoke('cards:list', options),
  random: (category) => ipcRenderer.invoke('cards:random', category),
  pickTrio: (mode, previousIds) => ipcRenderer.invoke('cards:pick-trio', mode, previousIds),
  get: (id) => ipcRenderer.invoke('cards:get', id),
  create: (card, imageData) => ipcRenderer.invoke('cards:create', card, imageData),
  update: (id, card, imageData) => ipcRenderer.invoke('cards:update', id, card, imageData),
  delete: (id) => ipcRenderer.invoke('cards:delete', id),
  image: (name) => ipcRenderer.invoke('cards:image', name),
});

contextBridge.exposeInMainWorld('akScannerCardSets', {
  list: (options) => ipcRenderer.invoke('card-sets:list', options),
  get: (id) => ipcRenderer.invoke('card-sets:get', id),
  create: (input) => ipcRenderer.invoke('card-sets:create', input),
  update: (id, input) => ipcRenderer.invoke('card-sets:update', id, input),
  delete: (id) => ipcRenderer.invoke('card-sets:delete', id),
});
