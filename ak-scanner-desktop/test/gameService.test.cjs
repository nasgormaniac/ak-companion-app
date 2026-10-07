'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const { GameService } = require('../src/main/gameService.cjs');

async function withServer(handler, run) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(server.address().port);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('sends exactly the legacy POST contract and recognizes 2xx', async () => {
  let received;
  await withServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    received = {
      method: request.method,
      url: request.url,
      type: request.headers['content-type'],
      body: Buffer.concat(chunks).toString('utf8'),
    };
    response.writeHead(204).end();
  }, async (port) => {
    const game = new GameService({ port });
    const result = await game.sendManual('bn!@#$%^');
    assert.equal(result.ok, true);
    assert.equal(result.httpStatus, 204);
    assert.equal(result.status.state, 'CONNECTED');
    assert.match(result.message, /Check the game/);
    game.dispose();
  });
  assert.deepEqual(received, {
    method: 'POST', url: '/sys147/barcode', type: 'text/plain', body: 'bn!@#$%^',
  });
});

test('non-2xx response is visible and never retried', async () => {
  let count = 0;
  await withServer((_request, response) => {
    count += 1;
    response.writeHead(503).end('unavailable');
  }, async (port) => {
    const game = new GameService({ port });
    const result = await game.sendManual('bn123456');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'HTTP_ERROR');
    assert.equal(result.httpStatus, 503);
    assert.equal(result.status.state, 'CONNECTION_FAILED');
    game.dispose();
  });
  assert.equal(count, 1);
});

test('timeout is bounded and a second send is rejected while one is active', async () => {
  await withServer(() => {}, async (port) => {
    const game = new GameService({ port, timeoutMs: 50 });
    const first = game.sendManual('bn123456');
    const duplicate = await game.sendManual('bn123456');
    assert.equal(duplicate.code, 'SEND_IN_PROGRESS');
    const result = await first;
    assert.equal(result.code, 'TIMEOUT');
    assert.equal(result.status.state, 'CONNECTION_FAILED');
    game.dispose();
  });
});

test('oversized response is rejected even with a successful HTTP status', async () => {
  await withServer((_request, response) => {
    response.writeHead(200).end('x'.repeat(5000));
  }, async (port) => {
    const game = new GameService({ port });
    const result = await game.sendManual('bn123456');
    assert.equal(result.code, 'INVALID_RESPONSE');
    game.dispose();
  });
});

test('wrong or stopped local port is reported as a connection failure', async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  const game = new GameService({ port, timeoutMs: 500 });
  try {
    const result = await game.sendManual('bn123456');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'LOCAL_SERVICE_NOT_RUNNING');
    assert.equal(result.status.state, 'CONNECTION_FAILED');
  } finally { game.dispose(); }
});

test('malformed local HTTP response is rejected', async () => {
  const server = net.createServer((socket) => {
    socket.once('data', () => socket.end('not an HTTP response\r\n'));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const game = new GameService({ port: server.address().port, timeoutMs: 500 });
    const result = await game.sendManual('bn123456');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'INVALID_RESPONSE');
    game.dispose();
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('stored code is sent without repeating manual validation', async () => {
  let body;
  await withServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    body = Buffer.concat(chunks).toString('utf8');
    response.writeHead(200).end();
  }, async (port) => {
    const game = new GameService({ port });
    assert.equal((await game.sendStoredCode('legacy!')).ok, true);
    game.dispose();
  });
  assert.equal(body, 'legacy!');
});

test('closing aborts an active request without a retry', async () => {
  let count = 0;
  await withServer((_request, _response) => { count += 1; }, async (port) => {
    const game = new GameService({ port, timeoutMs: 1000 });
    const pending = game.sendManual('bn123456');
    game.dispose();
    const result = await pending;
    assert.equal(result.code, 'DISCONNECTED');
    assert.equal(result.status.state, 'DISCONNECTED');
  });
  assert.ok(count <= 1);
});
