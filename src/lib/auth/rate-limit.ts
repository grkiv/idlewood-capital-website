import { RateLimitConfig, RateLimitResult, RateLimitAttempt } from '@/lib/types/auth';

// Default rate limit configuration for login attempts
const DEFAULT_LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5, // 5 attempts
  windowMinutes: 15, // in 15 minutes
  blockDurationMinutes: 30 // block for 30 minutes after exceeding
};

// In-memory storage for rate limiting
// In production, this should be replaced with Redis or database
interface RateLimitStore {
  [key: string]: {
    attempts: RateLimitAttempt[];
    blockedUntil?: Date;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Generate rate limit key for IP + email combination
 */
function generateKey(ip: string, email?: string): string {
  return email ? `${ip}:${email.toLowerCase()}` : ip;
}

/**
 * Clean expired attempts from memory
 */
function cleanExpiredAttempts(
  attempts: RateLimitAttempt[], 
  windowMinutes: number
): RateLimitAttempt[] {
  const cutoff = new Date(Date.now() - (windowMinutes * 60 * 1000));
  return attempts.filter(attempt => attempt.timestamp > cutoff);
}

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  ip: string,
  email?: string,
  config: RateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT
): RateLimitResult {
  const key = generateKey(ip, email);
  const now = new Date();
  
  // Initialize store for this key if it doesn't exist
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { attempts: [] };
  }
  
  const store = rateLimitStore[key];
  
  // Check if currently blocked
  if (store.blockedUntil && now < store.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store.blockedUntil,
      blocked: true
    };
  }
  
  // Clean expired attempts
  store.attempts = cleanExpiredAttempts(store.attempts, config.windowMinutes);
  
  // Count failed attempts in the window
  const failedAttempts = store.attempts.filter(attempt => !attempt.success);
  const remaining = Math.max(0, config.maxAttempts - failedAttempts.length);
  
  // Check if limit exceeded
  if (failedAttempts.length >= config.maxAttempts) {
    // Block the key
    store.blockedUntil = new Date(now.getTime() + (config.blockDurationMinutes * 60 * 1000));
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: store.blockedUntil,
      blocked: true
    };
  }
  
  return {
    allowed: true,
    remaining,
    blocked: false
  };
}

/**
 * Record a login attempt (success or failure)
 */
export function recordAttempt(
  ip: string,
  success: boolean,
  email?: string,
  config: RateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT
): void {
  const key = generateKey(ip, email);
  
  // Initialize store for this key if it doesn't exist
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { attempts: [] };
  }
  
  const store = rateLimitStore[key];
  
  // Add the attempt
  const attempt: RateLimitAttempt = {
    ip,
    email,
    timestamp: new Date(),
    success
  };
  
  store.attempts.push(attempt);
  
  // If successful, clear the block and remove failed attempts
  if (success) {
    store.blockedUntil = undefined;
    // Keep only successful attempts to maintain rate limit for successful logins
    store.attempts = store.attempts.filter(a => a.success || a.timestamp > new Date(Date.now() - (config.windowMinutes * 60 * 1000)));
  }
  
  // Clean old attempts
  store.attempts = cleanExpiredAttempts(store.attempts, config.windowMinutes);
}

/**
 * Reset rate limit for a specific IP/email combination
 */
export function resetRateLimit(ip: string, email?: string): void {
  const key = generateKey(ip, email);
  delete rateLimitStore[key];
}

/**
 * Get current rate limit status without checking
 */
export function getRateLimitStatus(
  ip: string,
  email?: string,
  config: RateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT
): RateLimitResult {
  const key = generateKey(ip, email);
  const now = new Date();
  
  if (!rateLimitStore[key]) {
    return {
      allowed: true,
      remaining: config.maxAttempts,
      blocked: false
    };
  }
  
  const store = rateLimitStore[key];
  
  // Check if currently blocked
  if (store.blockedUntil && now < store.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store.blockedUntil,
      blocked: true
    };
  }
  
  // Clean expired attempts
  const cleanAttempts = cleanExpiredAttempts(store.attempts, config.windowMinutes);
  const failedAttempts = cleanAttempts.filter(attempt => !attempt.success);
  const remaining = Math.max(0, config.maxAttempts - failedAttempts.length);
  
  return {
    allowed: remaining > 0,
    remaining,
    blocked: false
  };
}

/**
 * Clean up expired entries from memory
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = new Date();
  const keys = Object.keys(rateLimitStore);
  
  for (const key of keys) {
    const store = rateLimitStore[key];
    
    // Remove entries that are no longer blocked and have no recent attempts
    if (!store.blockedUntil || store.blockedUntil < now) {
      store.attempts = cleanExpiredAttempts(store.attempts, DEFAULT_LOGIN_RATE_LIMIT.windowMinutes);
      
      // If no attempts left, remove the entry
      if (store.attempts.length === 0) {
        delete rateLimitStore[key];
      }
    }
  }
}

/**
 * Get rate limit configuration
 */
export function getRateLimitConfig(): RateLimitConfig {
  return { ...DEFAULT_LOGIN_RATE_LIMIT };
}

/**
 * Create custom rate limit configuration
 */
export function createRateLimitConfig(
  maxAttempts: number,
  windowMinutes: number,
  blockDurationMinutes: number
): RateLimitConfig {
  return {
    maxAttempts,
    windowMinutes,
    blockDurationMinutes
  };
}

/**
 * Get statistics about rate limiting
 */
export function getRateLimitStats(): {
  totalKeys: number;
  blockedKeys: number;
  totalAttempts: number;
} {
  const now = new Date();
  let totalKeys = 0;
  let blockedKeys = 0;
  let totalAttempts = 0;
  
  for (const store of Object.values(rateLimitStore)) {
    totalKeys++;
    totalAttempts += store.attempts.length;
    
    if (store.blockedUntil && store.blockedUntil > now) {
      blockedKeys++;
    }
  }
  
  return {
    totalKeys,
    blockedKeys,
    totalAttempts
  };
}

/**
 * Advanced rate limiting with progressive delays
 */
export function getProgressiveDelay(attemptCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 60s
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount - 1), maxDelay);
  return delay;
}

/**
 * Check if IP should be temporarily blocked based on suspicious behavior
 */
export function checkSuspiciousActivity(ip: string): boolean {
  const key = generateKey(ip);
  const store = rateLimitStore[key];
  
  if (!store || store.attempts.length === 0) {
    return false;
  }
  
  // Check for rapid successive attempts (more than 10 in 1 minute)
  const oneMinuteAgo = new Date(Date.now() - (60 * 1000));
  const recentAttempts = store.attempts.filter(attempt => attempt.timestamp > oneMinuteAgo);
  
  if (recentAttempts.length > 10) {
    return true;
  }
  
  // Check for attempts with multiple different emails (credential stuffing)
  const emails = new Set(store.attempts.map(a => a.email).filter(Boolean));
  if (emails.size > 5) {
    return true;
  }
  
  return false;
}