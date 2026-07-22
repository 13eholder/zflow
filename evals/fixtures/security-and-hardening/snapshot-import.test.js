'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { importSnapshot } = require('./snapshot-import');

test('returns a bounded snapshot preview from a successful fetch', async () => {
  const result = await importSnapshot('https://snapshots.example.com/snap-001', async () => ({
    status: 200,
    text: async () => 'ok',
  }));
  assert.deepEqual(result, { status: 200, body: 'ok' });
});
