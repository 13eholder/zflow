'use strict';

const fs = require('fs');
const path = require('path');

async function exportRecords(records, outputPath, metrics) {
  const header = 'name,total\n';
  const body = records.map((r) => `${r.name},${r.total}`).join('\n');
  const csv = header + body;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, csv, 'utf-8');

  const written = fs.readFileSync(outputPath, 'utf-8');
  if (written !== csv) {
    throw new Error('Write verification failed: on-disk content mismatch');
  }

  metrics.increment('records.exported', { count: records.length });
}

module.exports = { exportRecords };
