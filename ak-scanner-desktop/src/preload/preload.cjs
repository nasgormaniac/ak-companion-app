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
  get: (id) => ipcRenderer.invoke('cards:get', id),
  create: (card, imageData) => ipcRenderer.invoke('cards:create', card, imageData),
  update: (id, card, imageData) => ipcRenderer.invoke('cards:update', id, card, imageData),
  delete: (id) => ipcRenderer.invoke('cards:delete', id),
  image: (name) => ipcRenderer.invoke('cards:image', name),
});
