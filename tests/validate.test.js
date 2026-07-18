import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Request Validation Schemas', () => {
  it('should accept valid email request', () => {
    const schema = z.object({
      email: z.string().min(1).max(254).email(),
    });

    const result = schema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const schema = z.object({
      email: z.string().min(1).max(254).email(),
    });

    const result = schema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('should reject empty email', () => {
    const schema = z.object({
      email: z.string().min(1).max(254).email(),
    });

    const result = schema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('should accept valid bulk request', () => {
    const schema = z.object({
      emails: z.array(z.string().email()).min(1).max(10000),
    });

    const result = schema.safeParse({
      emails: ['user@example.com', 'test@gmail.com'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty bulk request', () => {
    const schema = z.object({
      emails: z.array(z.string().email()).min(1).max(10000),
    });

    const result = schema.safeParse({ emails: [] });
    expect(result.success).toBe(false);
  });

  it('should reject bulk with invalid emails', () => {
    const schema = z.object({
      emails: z.array(z.string().email()).min(1).max(10000),
    });

    const result = schema.safeParse({
      emails: ['valid@example.com', 'invalid-email'],
    });
    expect(result.success).toBe(false);
  });
});

describe('Sanitize Input', () => {
  it('should strip control characters', () => {
    function sanitizeInput(text) {
      return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }

    expect(sanitizeInput('user@\x00example.com')).toBe('user@example.com');
    expect(sanitizeInput('test\x07@gmail.com')).toBe('test@gmail.com');
    expect(sanitizeInput('clean@email.com')).toBe('clean@email.com');
  });
});
