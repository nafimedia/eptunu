import argon2 from 'argon2';
import crypto from 'crypto';

const LEGACY_SALT = 'starter_kit_salt_2026';

export interface CompareResult {
  isValid: boolean;
  needsRehash: boolean;
}

/**
 * Hash password using Argon2id algorithm (OWASP recommended parameters)
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3,
  });
}

/**
 * Compare plain text password against stored hash.
 * Supports legacy SHA256 hashes and indicates if re-hashing to Argon2id is needed.
 */
export async function comparePassword(password: string, hash: string): Promise<CompareResult> {
  if (!hash) {
    return { isValid: false, needsRehash: false };
  }

  // Check if hash is Argon2 (starts with $argon2)
  if (hash.startsWith('$argon2')) {
    try {
      const isValid = await argon2.verify(hash, password);
      return { isValid, needsRehash: false };
    } catch (err) {
      return { isValid: false, needsRehash: false };
    }
  }

  // Legacy SHA256 HMAC Fallback
  const legacyHash = crypto.createHmac('sha256', LEGACY_SALT).update(password).digest('hex');
  const isValid = legacyHash === hash;

  return {
    isValid,
    needsRehash: isValid, // If legacy password is valid, flag it for auto-upgrade to Argon2id
  };
}
