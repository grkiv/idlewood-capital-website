import bcrypt from 'bcryptjs';
import { PasswordPolicy, PasswordValidationResult } from '@/lib/types/auth';

// Password policy configuration
const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

// Salt rounds for bcrypt (12 is recommended for 2024)
const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt with secure salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against hash using constant-time comparison
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Failed to verify password');
  }
}

/**
 * Validate password against security policy
 */
export function validatePassword(
  password: string, 
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  
  // Check uppercase requirement
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check lowercase requirement
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check numbers requirement
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check special characters requirement
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /^(.)\1+$/, // All same character
    /^(..)\1+$/, // Repeated pairs
    /^123456/, // Sequential numbers
    /^abcdef/i, // Sequential letters
    /password/i, // Contains "password"
    /^qwerty/i, // QWERTY pattern
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains a common weak pattern');
      break;
    }
  }
  
  // Calculate password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let strengthScore = 0;
  
  // Length scoring
  if (password.length >= 8) strengthScore += 1;
  if (password.length >= 12) strengthScore += 1;
  if (password.length >= 16) strengthScore += 1;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) strengthScore += 1;
  if (/[A-Z]/.test(password)) strengthScore += 1;
  if (/\d/.test(password)) strengthScore += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?~`]/.test(password)) strengthScore += 1;
  
  // Bonus for high entropy
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.75) strengthScore += 1;
  
  if (strengthScore >= 7) {
    strength = 'strong';
  } else if (strengthScore >= 5) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Check if password needs rehashing (due to changed salt rounds)
 */
export function needsRehash(hash: string): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch {
    return true; // If we can't determine rounds, assume it needs rehashing
  }
}

/**
 * Generate secure random password (for temporary passwords)
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Ensure password meets all requirements
  password += 'A'; // uppercase
  password += 'a'; // lowercase  
  password += '1'; // number
  password += '!'; // special char
  
  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password to randomize positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Estimate time to crack password (rough estimation)
 */
export function estimateCrackTime(password: string): {
  seconds: number;
  humanReadable: string;
} {
  const charsetSizes = {
    lowercase: 26,
    uppercase: 26,
    numbers: 10,
    special: 32
  };
  
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += charsetSizes.lowercase;
  if (/[A-Z]/.test(password)) charsetSize += charsetSizes.uppercase;
  if (/\d/.test(password)) charsetSize += charsetSizes.numbers;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?~`]/.test(password)) charsetSize += charsetSizes.special;
  
  const entropy = password.length * Math.log2(charsetSize);
  const guessesPerSecond = 10000000000; // 10 billion guesses per second (modern GPU)
  const seconds = Math.pow(2, entropy - 1) / guessesPerSecond;
  
  let humanReadable: string;
  if (seconds < 60) {
    humanReadable = `${Math.round(seconds)} seconds`;
  } else if (seconds < 3600) {
    humanReadable = `${Math.round(seconds / 60)} minutes`;
  } else if (seconds < 86400) {
    humanReadable = `${Math.round(seconds / 3600)} hours`;
  } else if (seconds < 31536000) {
    humanReadable = `${Math.round(seconds / 86400)} days`;
  } else if (seconds < 31536000 * 100) {
    humanReadable = `${Math.round(seconds / 31536000)} years`;
  } else {
    humanReadable = 'more than a lifetime';
  }
  
  return { seconds, humanReadable };
}

/**
 * Check for breached passwords using SHA-1 hash prefix
 * In production, you might want to integrate with HaveIBeenPwned API
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'Password1', 'password1', '123123', 'qwerty123'
  ];
  
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
}

/**
 * Get password policy for display to users
 */
export function getPasswordPolicy(): PasswordPolicy {
  return { ...DEFAULT_PASSWORD_POLICY };
}

/**
 * Format password policy as user-friendly rules
 */
export function formatPasswordRules(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): string[] {
  const rules: string[] = [];
  
  rules.push(`At least ${policy.minLength} characters long`);
  
  if (policy.requireUppercase) {
    rules.push('At least one uppercase letter (A-Z)');
  }
  
  if (policy.requireLowercase) {
    rules.push('At least one lowercase letter (a-z)');
  }
  
  if (policy.requireNumbers) {
    rules.push('At least one number (0-9)');
  }
  
  if (policy.requireSpecialChars) {
    rules.push('At least one special character (!@#$%^&*...)');
  }
  
  rules.push('No common passwords or predictable patterns');
  
  return rules;
}