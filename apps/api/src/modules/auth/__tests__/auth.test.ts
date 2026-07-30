import { describe, it, expect } from 'vitest';
import { globalErrorHandler } from '../../../middleware/error-handler';
import { hashPassword, comparePassword } from '../../../services/hash';
import { ZodError, z } from 'zod';
import crypto from 'crypto';

describe('Argon2id Hashing & Verification Suite', () => {
  it('should hash password using Argon2id and verify correctly', async () => {
    const plainPassword = 'mySecretPassword123!';
    const hash = await hashPassword(plainPassword);

    expect(hash).toContain('$argon2id$');

    const result = await comparePassword(plainPassword, hash);
    expect(result.isValid).toBe(true);
    expect(result.needsRehash).toBe(false);
  });

  it('should reject incorrect password with Argon2id', async () => {
    const plainPassword = 'mySecretPassword123!';
    const hash = await hashPassword(plainPassword);

    const result = await comparePassword('wrongPassword', hash);
    expect(result.isValid).toBe(false);
    expect(result.needsRehash).toBe(false);
  });

  it('should verify legacy SHA256 password and flag needsRehash: true for auto-upgrading', async () => {
    const plainPassword = 'password123';
    const legacySalt = 'starter_kit_salt_2026';
    const legacyHash = crypto.createHmac('sha256', legacySalt).update(plainPassword).digest('hex');

    const result = await comparePassword(plainPassword, legacyHash);
    expect(result.isValid).toBe(true);
    expect(result.needsRehash).toBe(true);
  });
});

describe('API Global Error Handler & Validation Suite', () => {
  it('should format Zod validation errors into standard JSON format', () => {
    const schema = z.object({
      email: z.string().email('Format email tidak valid'),
      password: z.string().min(6, 'Password minimal 6 karakter'),
    });

    try {
      schema.parse({ email: 'invalid-email', password: '123' });
    } catch (err) {
      expect(err).toBeInstanceOf(ZodError);
      if (err instanceof ZodError) {
        let sentStatus = 0;
        let sentBody: any = null;

        const mockReply: any = {
          status: (code: number) => {
            sentStatus = code;
            return mockReply;
          },
          send: (body: any) => {
            sentBody = body;
            return mockReply;
          },
        };

        const mockRequest: any = {
          log: { error: () => {} },
        };

        globalErrorHandler(err, mockRequest, mockReply);

        expect(sentStatus).toBe(400);
        expect(sentBody.success).toBe(false);
        expect(sentBody.error.code).toBe('VALIDATION_ERROR');
        expect(sentBody.error.details.length).toBeGreaterThan(0);
      }
    }
  });

  it('should handle 401 Unauthorized status error', () => {
    let sentStatus = 0;
    let sentBody: any = null;

    const mockReply: any = {
      status: (code: number) => {
        sentStatus = code;
        return mockReply;
      },
      send: (body: any) => {
        sentBody = body;
        return mockReply;
      },
    };

    const mockRequest: any = {
      log: { error: () => {} },
    };

    const error: any = new Error('Token expired or missing');
    error.statusCode = 401;

    globalErrorHandler(error, mockRequest, mockReply);

    expect(sentStatus).toBe(401);
    expect(sentBody.success).toBe(false);
    expect(sentBody.error.code).toBe('UNAUTHORIZED');
  });
});
