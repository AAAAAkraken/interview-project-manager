import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRepoPath } from '../.test-dist/lib/projects/repoPath.js';

test('normalizeRepoPath trims whitespace and removes matching wrapping quotes', () => {
  assert.equal(normalizeRepoPath('  "C:\\Users\\35723\\Desktop\\识别转换json"  '), 'C:\\Users\\35723\\Desktop\\识别转换json');
  assert.equal(normalizeRepoPath(" 'C:\\Projects\\app' "), 'C:\\Projects\\app');
  assert.equal(normalizeRepoPath('C:\\Projects\\app'), 'C:\\Projects\\app');
});

test('normalizeRepoPath leaves non-matching quotes alone', () => {
  assert.equal(normalizeRepoPath('"C:\\Projects\\app'), '"C:\\Projects\\app');
  assert.equal(normalizeRepoPath(123), '');
});
