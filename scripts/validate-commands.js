#!/usr/bin/env node
/**
 * validate-commands.js
 *
 * Validates the supported command manifests in commands/ (.toml).
 *
 * Checks (errors block CI):
 *   - every command file has a non-empty description field
 *
 * Exit codes: 0 = all clear, 1 = one or more errors
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMMANDS_DIR = path.join(ROOT, 'commands');

function descriptionFromToml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const doubleMatch = content.match(/^description\s*=\s*"((?:[^"\\]|\\.)*)"/m);
  if (doubleMatch) return doubleMatch[1].replace(/\\"/g, '"');
  const singleMatch = content.match(/^description\s*=\s*'([^']*)'/m);
  return singleMatch ? singleMatch[1] : null;
}

function loadCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) return {};
  return Object.fromEntries(
    fs.readdirSync(COMMANDS_DIR)
      .filter((file) => file.endsWith('.toml'))
      .map((file) => {
        const stem = path.basename(file, '.toml');
        const full = path.join(COMMANDS_DIR, file);
        try {
          return [stem, descriptionFromToml(full)];
        } catch (error) {
          console.log(`  ✗  ${stem} — cannot read file: ${error.message}`);
          return [stem, null];
        }
      }),
  );
}

function main() {
  const commands = loadCommands();
  const stems = Object.keys(commands).sort();
  let errors = 0;

  console.log('Checking command manifests...');
  for (const stem of stems) {
    if (!commands[stem]) {
      console.log(`  ✗  ${stem} — missing or malformed description`);
      errors++;
    } else {
      console.log(`  ✓  ${stem}`);
    }
  }

  const status = errors > 0 ? 'FAILED' : 'PASSED';
  console.log(`\n${stems.length} commands checked — ${errors} error(s) — ${status}`);
  if (errors > 0) process.exit(1);
}

main();
