'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { parseLeaseTimeout } = require('../api/timeout');
const { Worker } = require('./worker');

test('run returns the result and releases resources after work completes', async () => {
  const timeout = parseLeaseTimeout(1000);
  const signal = new AbortController().signal;
  const events = [];
  const worker = new Worker();

  const result = await worker.run(signal, timeout, async (receivedSignal) => {
    assert.equal(receivedSignal, signal);
    events.push('work');
    return 'completed';
  }, () => {
    events.push('release');
  });

  assert.equal(result, 'completed');
  assert.deepEqual(events, ['work', 'release']);
});
