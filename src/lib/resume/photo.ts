export function sanitizeResumePhotoDataUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('data:image/')) return '';
  if (!/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(trimmed)) return '';
  return trimmed;
}

export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: 'png' | 'jpg' | 'gif' | 'bmp' } | null {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  if (mimeType.endsWith('/jpeg') || mimeType.endsWith('/jpg')) {
    return {
      mimeType: 'jpg',
      buffer: Buffer.from(match[2], 'base64'),
    };
  }
  if (mimeType.endsWith('/png')) {
    return {
      mimeType: 'png',
      buffer: Buffer.from(match[2], 'base64'),
    };
  }
  if (mimeType.endsWith('/gif')) {
    return {
      mimeType: 'gif',
      buffer: Buffer.from(match[2], 'base64'),
    };
  }
  if (mimeType.endsWith('/bmp')) {
    return {
      mimeType: 'bmp',
      buffer: Buffer.from(match[2], 'base64'),
    };
  }
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mimeType: 'png',
  };
}
