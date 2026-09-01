import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeResumePhotoDataUrl } from '../.test-dist/lib/resume/photo.js';

test('keeps supported image data urls', () => {
  assert.equal(
    sanitizeResumePhotoDataUrl(' data:image/png;base64,abc123 '),
    'data:image/png;base64,abc123'
  );
  assert.equal(
    sanitizeResumePhotoDataUrl('data:image/jpeg;base64,abc123'),
    'data:image/jpeg;base64,abc123'
  );
});

test('drops unsupported photo values', () => {
  assert.equal(sanitizeResumePhotoDataUrl('http://example.com/photo.png'), '');
  assert.equal(sanitizeResumePhotoDataUrl('data:text/html;base64,abc123'), '');
  assert.equal(sanitizeResumePhotoDataUrl(undefined), '');
});
