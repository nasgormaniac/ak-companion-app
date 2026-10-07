'use strict';

const http = require('node:http');
const {
  DEFAULT_GAME_PORT,
  GAME_HOST,
  GAME_PATH,
  DEFAULT_TIMEOUT_MS,
  MAX_RESPONSE_BYTES,
  isValidManualCode,
  isValidPort,
  classifyNetworkError,
  messageForFailure,
} = require('./gameProtocol.cjs');

function postBarcode(code, { port, timeoutMs, requestImpl = http.request, trackRequest = () => {}, untrackRequest = () => {} }) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(code, 'utf8');
    let settled = false;
    let request;
    let deadline;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      if (request) untrackRequest(request);
      if (error) reject(error);
      else resolve(result);
    };

    try {
      request = requestImpl({
        hostname: GAME_HOST,
        port,
        path: GAME_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': body.length,
        },
        agent: false,
      }, (response) => {
        const status = response.statusCode;
        if (!Number.isInteger(status) || status < 100 || status > 599) {
          response.resume();
          finish(Object.assign(new Error('Invalid HTTP status'), { code: 'HPE_INVALID_STATUS' }));
          return;
        }
        let received = 0;
        response.on('data', (chunk) => {
          received += chunk.length;
          if (received > MAX_RESPONSE_BYTES) {
            const error = Object.assign(new Error('Response too large'), { code: 'HPE_RESPONSE_TOO_LARGE' });
            finish(error);
            request.destroy(error);
          }
        });
        response.on('end', () => finish(null, { status }));
        response.on('error', (error) => finish(error));
      });
      trackRequest(request);
      request.on('error', (error) => finish(error));
      deadline = setTimeout(() => {
        request.destroy(Object.assign(new Error('Game request timed out'), { code: 'ETIMEDOUT' }));
      }, timeoutMs);
      request.end(body);
    } catch (error) {
      finish(error);
    }
  });
}

class GameService {
  constructor({ port = DEFAULT_GAME_PORT, timeoutMs = DEFAULT_TIMEOUT_MS, requestImpl = http.request } = {}) {
    if (!isValidPort(port)) throw new TypeError('Invalid game port');
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new TypeError('Invalid game timeout');
    this.port = port;
    this.timeoutMs = timeoutMs;
    this.requestImpl = requestImpl;
    this.inFlight = new Set();
    this.sending = false;
    this.closed = false;
    this.status = { state: 'DISCONNECTED', detail: 'No scan sent in this session.', observedAt: null };
  }

  getStatus() {
    return { ...this.status, port: this.port, endpoint: `http://${GAME_HOST}:${this.port}${GAME_PATH}` };
  }

  setPort(port) {
    if (this.sending) {
      return { ok: false, code: 'SEND_IN_PROGRESS', message: messageForFailure('SEND_IN_PROGRESS'), status: this.getStatus() };
    }
    if (!isValidPort(port)) {
      this.status = { state: 'INVALID_CONFIGURATION', detail: messageForFailure('INVALID_CONFIGURATION'), observedAt: Date.now() };
      return { ok: false, code: 'INVALID_CONFIGURATION', message: this.status.detail, status: this.getStatus() };
    }
    this.port = port;
    this.status = { state: 'DISCONNECTED', detail: 'Port saved. The next scan will test the connection.', observedAt: null };
    return { ok: true, status: this.getStatus() };
  }

  async sendManual(code) {
    if (!isValidManualCode(code)) {
      return { ok: false, code: 'INVALID_CODE', message: messageForFailure('INVALID_CODE'), status: this.getStatus() };
    }
    return this.sendStoredCode(code);
  }

  async sendStoredCode(code) {
    if (typeof code !== 'string') {
      return { ok: false, code: 'CARD_NOT_FOUND', message: messageForFailure('CARD_NOT_FOUND'), status: this.getStatus() };
    }
    if (this.closed) {
      return { ok: false, code: 'DISCONNECTED', message: messageForFailure('DISCONNECTED'), status: this.getStatus() };
    }
    if (this.sending) {
      return { ok: false, code: 'SEND_IN_PROGRESS', message: messageForFailure('SEND_IN_PROGRESS'), status: this.getStatus() };
    }
    this.sending = true;
    this.status = { state: 'CONNECTING', detail: 'Sending card code to the game service…', observedAt: Date.now() };
    try {
      const response = await postBarcode(code, {
        port: this.port,
        timeoutMs: this.timeoutMs,
        requestImpl: this.requestImpl,
        trackRequest: (request) => this.inFlight.add(request),
        untrackRequest: (request) => this.inFlight.delete(request),
      });
      if (response.status < 200 || response.status >= 300) {
        const message = messageForFailure('HTTP_ERROR', response.status);
        this.status = { state: 'CONNECTION_FAILED', detail: message, observedAt: Date.now(), httpStatus: response.status };
        return { ok: false, code: 'HTTP_ERROR', httpStatus: response.status, message, status: this.getStatus() };
      }
      const message = `Local service accepted the request (HTTP ${response.status}). Check the game.`;
      this.status = { state: 'CONNECTED', detail: message, observedAt: Date.now(), httpStatus: response.status };
      return { ok: true, httpStatus: response.status, message, status: this.getStatus() };
    } catch (error) {
      const code = classifyNetworkError(error);
      const message = messageForFailure(code);
      this.status = { state: code === 'DISCONNECTED' ? 'DISCONNECTED' : 'CONNECTION_FAILED', detail: message, observedAt: Date.now(), reason: code };
      return { ok: false, code, message, status: this.getStatus() };
    } finally {
      this.sending = false;
    }
  }

  dispose() {
    this.closed = true;
    for (const request of this.inFlight) {
      request.destroy(Object.assign(new Error('App closing'), { code: 'ABORTED' }));
    }
    this.inFlight.clear();
    this.status = { state: 'DISCONNECTED', detail: 'App closed.', observedAt: Date.now() };
  }
}

module.exports = { GameService, postBarcode };
