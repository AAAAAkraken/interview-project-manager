import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPersonalInfoSection,
  parsePersonalInfoRows,
} from '../.test-dist/lib/resume/personalInfo.js';

test('detects personal information sections by type or title', () => {
  assert.equal(isPersonalInfoSection({ type: 'basic', title: '任意标题' }), true);
  assert.equal(isPersonalInfoSection({ type: 'custom', title: '个人信息' }), true);
  assert.equal(isPersonalInfoSection({ type: 'custom', title: '工作经历' }), false);
});

test('splits personal information content into rows and cells', () => {
  const rows = parsePersonalInfoRows('张三 | 13800000000 | zhang@example.com\n求职目标：前端开发工程师');

  assert.deepEqual(rows.map(row => row.cells), [
    ['张三', '13800000000', 'zhang@example.com'],
    ['求职目标：前端开发工程师'],
  ]);
});
