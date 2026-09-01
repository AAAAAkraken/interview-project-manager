import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeImportHtml } from '../.test-dist/lib/resume/docxParser.js';

test('keeps document structure while removing unsafe html from import preview', () => {
  const html = [
    '<h1 onclick="alert(1)">张三</h1>',
    '<p><strong>前端开发工程师</strong><script>alert(1)</script></p>',
    '<table><tr><td onmouseover="bad()">学校</td><td>某某大学</td></tr></table>',
  ].join('');

  const sanitized = sanitizeImportHtml(html);

  assert.match(sanitized, /<h1>张三<\/h1>/);
  assert.match(sanitized, /<strong>前端开发工程师<\/strong>/);
  assert.match(sanitized, /<table><tr><td>学校<\/td><td>某某大学<\/td><\/tr><\/table>/);
  assert.doesNotMatch(sanitized, /script/i);
  assert.doesNotMatch(sanitized, /onmouseover|onclick/i);
});
