import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('API Key Hashing', () => {
  function hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  it('should produce consistent hashes', () => {
    const key = 'bev_test123';
    expect(hashKey(key)).toBe(hashKey(key));
  });

  it('should produce different hashes for different keys', () => {
    expect(hashKey('key1')).not.toBe(hashKey('key2'));
  });

  it('should produce 64-char hex strings', () => {
    const hash = hashKey('test');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('Key Format', () => {
  it('should generate keys with bev_ prefix', () => {
    const key = 'bev_' + crypto.randomBytes(48).toString('base64url');
    expect(key.startsWith('bev_')).toBe(true);
  });

  it('should extract prefix correctly', () => {
    const key = 'bev_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP';
    expect(key.substring(0, 12)).toBe('bev_abcdefgh');
  });
});
