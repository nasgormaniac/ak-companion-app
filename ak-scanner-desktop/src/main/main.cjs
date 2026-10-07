'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const { GameService } = require('./gameService.cjs');
const { readGameSettings, writeGameSettings } = require('./gameSettings.cjs');
const { registerGameIpc } = require('./gameIpc.cjs');
const { DatabaseError, openDesktopDatabase } = require('./sqliteDatabase.cjs');
const { CardRepository } = require('./cardRepository.cjs');
const { registerCardIpc } = require('./cardIpc.cjs');

const DEV_URL = 'http://127.0.0.1:5173';
let mainWindow;
let gameService;
let unregisterIpc;
let unregisterCardIpc;
let desktopDatabase;
let cardRepository;

function createMainWindow() {
  if (unregisterIpc) {
    unregisterIpc();
    unregisterIpc = null;
  }
  if (unregisterCardIpc) { unregisterCardIpc(); unregisterCardIpc = null; }
  if (gameService) gameService.dispose();
  const development = !app.isPackaged && process.env.AK_SCANNER_DEV_URL === DEV_URL;
  const rendererFile = path.join(__dirname, '..', '..', 'dist', 'index.html');
  const builtIcon = path.join(__dirname, '..', '..', 'dist', 'window-icon.png');
  const windowIcon = fs.existsSync(builtIcon) ? builtIcon : path.join(__dirname, '..', '..', 'public', 'window-icon.png');
  const trustedFrameUrl = development ? `${DEV_URL}/` : pathToFileURL(rendererFile).toString();

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 540,
    title: 'Animal Kaiser Scanner',
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl !== trustedFrameUrl) event.preventDefault();
  });

  const userDataPath = app.getPath('userData');
  const settings = readGameSettings(userDataPath);
  gameService = new GameService({ port: settings.port });
  if (settings.warning) {
    dialog.showMessageBox(mainWindow, { type: 'warning', title: 'Game port setting', message: settings.warning });
  }
  unregisterIpc = registerGameIpc({
    ipcMain,
    mainWindow,
    gameService,
    writeSettings: (port) => writeGameSettings(userDataPath, port),
    trustedFrameUrl,
    lookupSavedCardCode: (id) => cardRepository.getStoredCode(id),
  });
  unregisterCardIpc = registerCardIpc({
    ipcMain, mainWindow, repository: cardRepository, userDataPath, trustedFrameUrl,
    onCleanupWarning: (count) => {
      dialog.showMessageBox(mainWindow, {
        type: 'warning', title: 'Card image cleanup',
        message: `${count} unused card image${count === 1 ? '' : 's'} could not be removed. Check the app storage permissions; cleanup will be retried on a later start.`,
      });
    },
  });

  mainWindow.on('closed', () => {
    if (gameService) gameService.dispose();
    if (unregisterIpc) unregisterIpc();
    if (unregisterCardIpc) unregisterCardIpc();
    unregisterIpc = null;
    unregisterCardIpc = null;
    mainWindow = null;
  });

  if (development) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(rendererFile);
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.animalkaiser.scanner');
  // Preserve cards, images and settings created by the previous Windows release.
  app.setPath('userData', path.join(app.getPath('appData'), 'AK Scanner'));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    desktopDatabase = openDesktopDatabase(app.getPath('userData'));
    cardRepository = new CardRepository(desktopDatabase.db);
    createMainWindow();
  }).catch((error) => {
    dialog.showErrorBox('Could not start Animal Kaiser Scanner', error instanceof DatabaseError ? error.message : 'The app could not start. Check its local files and try again.');
    app.quit();
  });
}

app.on('before-quit', () => {
  if (gameService) gameService.dispose();
  if (unregisterIpc) unregisterIpc();
  if (unregisterCardIpc) unregisterCardIpc();
  if (desktopDatabase) {
    desktopDatabase.close();
    desktopDatabase = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
