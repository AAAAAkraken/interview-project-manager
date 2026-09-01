import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { scanSourceFiles } from '../.test-dist/lib/analysis/sourceScanner.js';

test('scans source files and ignores noisy directories', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-'));
  fs.mkdirSync(path.join(root, 'src'));
  fs.mkdirSync(path.join(root, 'node_modules'));
  fs.mkdirSync(path.join(root, '.git'));
  fs.writeFileSync(path.join(root, 'src', 'app.ts'), 'export const value = 1;');
  fs.writeFileSync(path.join(root, 'node_modules', 'bad.ts'), 'ignored');
  fs.writeFileSync(path.join(root, '.git', 'config'), 'ignored');
  fs.writeFileSync(path.join(root, 'image.png'), 'ignored');

  const files = scanSourceFiles(root);

  assert.deepEqual(files.map(file => file.relativePath), ['src/app.ts']);
  assert.equal(files[0].content, 'export const value = 1;');
});

test('respects max file count', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-limit-'));
  fs.writeFileSync(path.join(root, 'a.ts'), 'a');
  fs.writeFileSync(path.join(root, 'b.ts'), 'b');

  const files = scanSourceFiles(root, { maxFiles: 1 });

  assert.equal(files.length, 1);
});
