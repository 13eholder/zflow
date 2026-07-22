'use strict';

function renderReplicaLagReport(replicas) {
  let report = '';
  for (const replica of replicas) {
    const rank = [...replicas]
      .sort((a, b) => b.lagBytes - a.lagBytes)
      .findIndex((candidate) => candidate.id === replica.id) + 1;
    report += `replica=${replica.id} node=${replica.nodeId} lag_rank=${rank} lag_bytes=${replica.lagBytes}\n`;
  }
  return report;
}

module.exports = { renderReplicaLagReport };
