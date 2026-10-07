'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { CardDataError, normalizeCard } = require('./cardRepository.cjs');

const CHANNELS = ['cards:list', 'cards:get', 'cards:create', 'cards:update', 'cards:delete', 'cards:image'];
const IMAGE_NAME = /^[a-f0-9]{32}\.(?:jpg|png)$/;
const MAX_IMAGE_BYTES = require('../shared/imageRules.json').maxBytes;
const MAX_STORED_IMAGE_BYTES = 8 * 1024 * 1024;
const ORPHAN_GRACE_MS = 60 * 1000;
const PLACEHOLDER_IMAGE = `${'0'.repeat(32)}.png`;
const CREATE_FIELDS = new Set(['category', 'nama', 'rarity', 'card_code', 'gold_attack', 'card_type', 'guts_level', 'tech_level', 'power_level', 'aura', 'effect']);
const UPDATE_FIELDS = new Set([...CREATE_FIELDS].filter((field) => field !== 'category'));

function validDimensions(width, height) {
  return width > 0 && height > 0 && width <= 8192 && height <= 8192 && width * height <= 32_000_000;
}

function isStructuredPng(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 57 || !bytes.subarray(0, 8).equals(signature)) return false;
  let offset = 8;
  let hasHeader = false;
  let hasData = false;
  while (offset + 12 <= bytes.length) {
    const size = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (size > bytes.length - offset - 12) return false;
    if (!hasHeader) {
      if (type !== 'IHDR' || size !== 13 || !validDimensions(bytes.readUInt32BE(offset + 8), bytes.readUInt32BE(offset + 12))) return false;
      hasHeader = true;
    } else if (type === 'IHDR') return false;
    if (type === 'IDAT' && size > 0) hasData = true;
    offset += size + 12;
    if (type === 'IEND') return size === 0 && hasData && offset === bytes.length;
  }
  return false;
}

function isStructuredJpeg(bytes) {
  if (bytes.length < 12 || bytes[0] !== 255 || bytes[1] !== 216
    || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) return false;
  let offset = 2;
  let hasFrame = false;
  while (offset + 4 < bytes.length) {
    if (bytes[offset++] !== 255) return false;
    while (bytes[offset] === 255) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0 || marker === 216 || marker === 217 || offset + 2 > bytes.length) return false;
    const size = bytes.readUInt16BE(offset);
    if (size < 2 || offset + size > bytes.length) return false;
    if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
      if (size < 7 || !validDimensions(bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3))) return false;
      hasFrame = true;
    }
    if (marker === 218) return hasFrame && offset + size < bytes.length - 2;
    offset += size;
  }
  return false;
}

function assertPayload(payload, allowed) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(payload))) {
    throw new CardDataError('INVALID_CARD', 'Card data must be an object.');
  }
  const errors = {};
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) errors[key] = 'This card field cannot be changed here.';
  }
  if (Object.keys(errors).length) throw new CardDataError('INVALID_CARD', 'Check the card details.', errors);
}

function decodeImage(dataUrl) {
  if (typeof dataUrl !== 'string' || dataUrl.length > MAX_IMAGE_BYTES * 1.4) {
    throw new CardDataError('INVALID_IMAGE', 'Choose a JPEG or PNG image up to 1 MiB.', { image: 'Image must be up to 1 MiB.' });
  }
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new CardDataError('INVALID_IMAGE', 'Choose a JPEG or PNG image.', { image: 'Choose a JPEG or PNG image.' });
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || bytes.toString('base64') !== match[2]) throw new CardDataError('INVALID_IMAGE', 'Choose a valid image up to 1 MiB.', { image: 'Image must be a valid JPEG or PNG up to 1 MiB.' });
  const png = match[1] === 'png' && isStructuredPng(bytes);
  const jpeg = match[1] === 'jpeg' && isStructuredJpeg(bytes);
  if (!png && !jpeg) {
    throw new CardDataError('INVALID_IMAGE', 'The selected image is not a valid JPEG or PNG.', { image: 'Image format does not match its contents.' });
  }
  return { bytes, extension: png ? 'png' : 'jpg' };
}

function publicError(error) {
  if (error instanceof CardDataError) return { ok: false, code: error.code, message: error.message, fieldErrors: error.fieldErrors, cleanupWarning: !!error.cleanupWarning };
  if (error?.code === 'ENOENT') return { ok: false, code: 'FILE_NOT_FOUND', message: 'The card image file is missing.' };
  if (error?.code === 'EACCES' || error?.code === 'EPERM') return { ok: false, code: 'STORAGE_PERMISSION', message: 'The app cannot access its local files. Check storage permissions.' };
  return { ok: false, code: 'STORAGE_ERROR', message: 'Could not access the local card data.' };
}

function registerCardIpc({ ipcMain, mainWindow, repository, userDataPath, trustedFrameUrl, fileOps = fs, onCleanupWarning = () => {} }) {
  const imagesPath = path.join(userDataPath, 'images');
  fileOps.mkdirSync(imagesPath, { recursive: true });
  function authorize(event) {
    if (!event.senderFrame || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame || event.senderFrame.url !== trustedFrameUrl) {
      throw new Error('Unauthorized card IPC sender');
    }
  }
  function imageFile(name) {
    if (!IMAGE_NAME.test(name)) throw new CardDataError('INVALID_IMAGE', 'Invalid card image name.');
    return path.join(imagesPath, name);
  }
  function saveImage(dataUrl) {
    const { bytes, extension } = decodeImage(dataUrl);
    const name = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
    fileOps.writeFileSync(imageFile(name), bytes, { flag: 'wx' });
    return name;
  }
  function removeImage(name) {
    if (name) fileOps.rmSync(imageFile(name), { force: true });
  }
  function cleanupWarning(error) {
    const warning = new CardDataError(error.code || 'IMAGE_CLEANUP_FAILED', `${error.message || 'Card operation failed.'} An unused image could not be removed; the app will retry on a later start.`, error.fieldErrors || {});
    warning.cleanupWarning = true;
    return warning;
  }
  let orphanFailures = 0;
  for (const entry of fileOps.readdirSync(imagesPath, { withFileTypes: true })) {
    if (!entry.isFile() || !IMAGE_NAME.test(entry.name) || repository.hasImage(entry.name)) continue;
    try {
      if (Date.now() - fileOps.statSync(imageFile(entry.name)).mtimeMs < ORPHAN_GRACE_MS) continue;
      removeImage(entry.name);
    } catch { orphanFailures += 1; }
  }
  if (orphanFailures) onCleanupWarning(orphanFailures);
  function handle(channel, argCount, work) {
    ipcMain.handle(channel, (event, ...args) => {
      authorize(event);
      try {
        if (args.length !== argCount) throw new CardDataError('INVALID_PAYLOAD', 'Invalid request details.');
        return { ok: true, data: work(...args) };
      }
      catch (error) { return publicError(error); }
    });
  }
  handle('cards:list', 1, (options) => repository.list(options));
  handle('cards:get', 1, (id) => {
    const card = repository.getById(id);
    if (!card) throw new CardDataError('CARD_NOT_FOUND', 'Card not found.');
    return card;
  });
  handle('cards:image', 1, (name) => {
    const file = imageFile(name);
    if (!repository.hasImage(name)) throw new CardDataError('IMAGE_NOT_FOUND', 'Card image not found.');
    if (fileOps.statSync(file).size > MAX_STORED_IMAGE_BYTES) throw new CardDataError('INVALID_IMAGE', 'Card image is too large.');
    const bytes = fileOps.readFileSync(file);
    return `data:image/${name.endsWith('.png') ? 'png' : 'jpeg'};base64,${bytes.toString('base64')}`;
  });
  handle('cards:create', 2, (card, imageData) => {
    assertPayload(card, CREATE_FIELDS);
    normalizeCard({ ...card, image_path: PLACEHOLDER_IMAGE });
    const name = saveImage(imageData);
    try { return repository.create({ ...card, image_path: name }); }
    catch (error) { try { removeImage(name); } catch { throw cleanupWarning(error); } throw error; }
  });
  handle('cards:update', 3, (id, changes, imageData) => {
    const current = repository.getById(id);
    if (!current) throw new CardDataError('CARD_NOT_FOUND', 'Card not found.');
    assertPayload(changes, UPDATE_FIELDS);
    if (imageData !== null && imageData !== undefined) decodeImage(imageData);
    normalizeCard({ ...changes, ...(imageData ? { image_path: PLACEHOLDER_IMAGE } : {}) }, current);
    const name = imageData ? saveImage(imageData) : null;
    try {
      const updated = repository.update(id, { ...changes, ...(name ? { image_path: name } : {}) });
      if (name) {
        try { removeImage(current.image_path); } catch { return { ...updated, imageCleanupFailed: true }; }
      }
      return updated;
    } catch (error) { if (name) { try { removeImage(name); } catch { throw cleanupWarning(error); } } throw error; }
  });
  handle('cards:delete', 1, (id) => {
    const deleted = repository.delete(id);
    try { removeImage(deleted.image_path); }
    catch { return { ...deleted, imageCleanupFailed: true }; }
    return deleted;
  });
  return () => CHANNELS.forEach((channel) => ipcMain.removeHandler(channel));
}

module.exports = { registerCardIpc, decodeImage };
