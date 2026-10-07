'use strict';

const DEFAULT_GAME_PORT = 9876;
const GAME_HOST = '127.0.0.1';
const GAME_PATH = '/sys147/barcode';
const DEFAULT_TIMEOUT_MS = 4000;
const MAX_RESPONSE_BYTES = 4096;

// The old database contains punctuation after "bn". Spaces and non-ASCII
// bytes are intentionally excluded until the game's accepted alphabet is known.
const CARD_CODE_PATTERN = new RegExp(require('../shared/cardCode.json').pattern);

function isValidManualCode(value) {
  return typeof value === 'string' && CARD_CODE_PATTERN.test(value);
}

function isValidPort(value) {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

function classifyNetworkError(error) {
  if (error && error.code === 'ECONNREFUSED') return 'LOCAL_SERVICE_NOT_RUNNING';
  if (error && (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT')) return 'TIMEOUT';
  if (error && typeof error.code === 'string' && error.code.startsWith('HPE_')) return 'INVALID_RESPONSE';
  if (error && error.code === 'ABORTED') return 'DISCONNECTED';
  return 'CONNECTION_FAILED';
}

function messageForFailure(code, httpStatus) {
  switch (code) {
    case 'INVALID_CODE': return 'Card code must be exactly 8 printable characters starting with bn.';
    case 'INVALID_CONFIGURATION': return 'Game service port must be a number from 1 to 65535.';
    case 'LOCAL_SERVICE_NOT_RUNNING': return 'The local game service is unavailable. Check Play! and try again.';
    case 'TIMEOUT': return 'The game service did not respond in time.';
    case 'INVALID_RESPONSE': return 'The game service returned an invalid HTTP response.';
    case 'DISCONNECTED': return 'Sending stopped because the app closed.';
    case 'CARD_NOT_FOUND': return 'Saved card not found.';
    case 'CARD_STORE_NOT_READY': return 'The card catalogue is not available yet.';
    case 'SEND_IN_PROGRESS': return 'A card is already being sent. Wait for its result.';
    case 'HTTP_ERROR': return `The game service rejected the request (HTTP ${httpStatus}).`;
    default: return 'Could not reach the game service.';
  }
}

module.exports = {
  DEFAULT_GAME_PORT,
  GAME_HOST,
  GAME_PATH,
  DEFAULT_TIMEOUT_MS,
  MAX_RESPONSE_BYTES,
  isValidManualCode,
  isValidPort,
  classifyNetworkError,
  messageForFailure,
};
