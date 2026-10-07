'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidManualCode, isValidPort, classifyNetworkError } = require('../src/main/gameProtocol.cjs');

test('manual barcode accepts eight printable ASCII characters beginning with bn', () => {
  assert.equal(isValidManualCode('bn123456'), true);
  assert.equal(isValidManualCode('bn!@#$%^'), true);
  for (const code of ['BN123456', 'bn12345', 'bn1234567', 'bn12 456', 'bn12\n456', 'bn12345é', 12345678]) {
    assert.equal(isValidManualCode(code), false, String(code));
  }
});

test('port and network failures have stable classifications', () => {
  assert.equal(isValidPort(9876), true);
  for (const port of [0, 65536, 9876.5, '9876', NaN]) assert.equal(isValidPort(port), false);
  assert.equal(classifyNetworkError({ code: 'ECONNREFUSED' }), 'LOCAL_SERVICE_NOT_RUNNING');
  assert.equal(classifyNetworkError({ code: 'ETIMEDOUT' }), 'TIMEOUT');
  assert.equal(classifyNetworkError({ code: 'HPE_INVALID_CONSTANT' }), 'INVALID_RESPONSE');
});
