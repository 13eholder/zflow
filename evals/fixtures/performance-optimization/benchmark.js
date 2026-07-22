'use strict';

const { performance } = require('node:perf_hooks');
const { renderReplicaLagReport } = require('./replica-report');

const replicas = Array.from({ length: 1000 }, (_, id) => ({
  id,
  nodeId: `node-${id % 50}`,
  lagBytes: (id * 7919) % 1000000,
}));

const start = performance.now();
const output = renderReplicaLagReport(replicas);
const elapsed = performance.now() - start;
console.log(JSON.stringify({ replicas: replicas.length, bytes: output.length, elapsedMs: elapsed }));
