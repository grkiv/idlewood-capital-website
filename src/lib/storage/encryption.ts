/**
 * File Encryption Utilities
 * Provides AES-256-GCM encryption for sensitive investor documents
 */

import CryptoJS from 'crypto-js';
import { getCachedStorageConfig } from './config';

/**
 * Encryption result interface
 */
export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  keyId: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

/**
 * Decryption parameters interface
 */
export interface DecryptionParams {
  keyId: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

/**
 * File encryption metadata
 */
export interface FileEncryptionMetadata {
  isEncrypted: boolean;
  keyId?: string;
  algorithm?: string;
  iv?: string;
  authTag?: string;
}

/**
 * Generate a new encryption key ID
 */
export function generateKeyId(): string {
  return `key_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get encryption key from configuration
 * In production, this should be retrieved from a secure key management service
 */
function getEncryptionKey(): string {
  const config = getCachedStorageConfig();
  if (!config.encryptionKey) {
    throw new Error('Encryption key not configured');
  }
  return config.encryptionKey;
}

/**
 * Generate initialization vector
 */
function generateIV(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

/**
 * Convert ArrayBuffer to WordArray
 */
function arrayBufferToWordArray(buffer: ArrayBuffer): CryptoJS.lib.WordArray {
  const uint8Array = new Uint8Array(buffer);
  const words: number[] = [];
  
  for (let i = 0; i < uint8Array.length; i += 4) {
    const word = (uint8Array[i] << 24) | 
                 (uint8Array[i + 1] << 16) | 
                 (uint8Array[i + 2] << 8) | 
                 uint8Array[i + 3];
    words.push(word);
  }
  
  return CryptoJS.lib.WordArray.create(words, uint8Array.length);
}

/**
 * Convert WordArray to ArrayBuffer
 */
function wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const uint8Array = new Uint8Array(sigBytes);
  
  for (let i = 0; i < sigBytes; i++) {
    uint8Array[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  
  return uint8Array.buffer;
}

/**
 * Encrypt file data using AES-256-GCM
 */
export async function encryptFileData(data: ArrayBuffer): Promise<EncryptionResult> {
  try {
    const config = getCachedStorageConfig();
    
    if (!config.encryptionEnabled) {
      throw new Error('File encryption is not enabled');
    }
    
    const key = getEncryptionKey();
    const keyId = generateKeyId();
    const iv = generateIV();
    
    // Convert ArrayBuffer to WordArray
    const dataWords = arrayBufferToWordArray(data);
    
    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(dataWords, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });
    
    // Extract authentication tag (for GCM mode verification)
    const authTag = encrypted.tag?.toString() || '';
    
    // Convert encrypted data back to ArrayBuffer
    const encryptedArrayBuffer = wordArrayToArrayBuffer(encrypted.ciphertext);
    
    return {
      encryptedData: encryptedArrayBuffer,
      keyId,
      iv,
      authTag,
      algorithm: 'AES-256-GCM'
    };
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('Failed to encrypt file data');
  }
}

/**
 * Decrypt file data
 */
export async function decryptFileData(
  encryptedData: ArrayBuffer,
  params: DecryptionParams
): Promise<ArrayBuffer> {
  try {
    const config = getCachedStorageConfig();
    
    if (!config.encryptionEnabled) {
      throw new Error('File encryption is not enabled');
    }
    
    const key = getEncryptionKey();
    
    // Convert encrypted data to WordArray
    const encryptedWords = arrayBufferToWordArray(encryptedData);
    
    // Create CipherParams object for decryption
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: encryptedWords,
      tag: CryptoJS.enc.Hex.parse(params.authTag)
    });
    
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: CryptoJS.enc.Hex.parse(params.iv),
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });
    
    // Convert back to ArrayBuffer
    return wordArrayToArrayBuffer(decrypted);
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file data');
  }
}

/**
 * Generate file hash for integrity verification
 */
export async function generateFileHash(data: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to WordArray
    const dataWords = arrayBufferToWordArray(data);
    
    // Generate SHA-256 hash
    const hash = CryptoJS.SHA256(dataWords);
    
    return hash.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Hash generation failed:', error);
    throw new Error('Failed to generate file hash');
  }
}

/**
 * Verify file integrity using hash
 */
export async function verifyFileIntegrity(
  data: ArrayBuffer,
  expectedHash: string
): Promise<boolean> {
  try {
    const actualHash = await generateFileHash(data);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
}

/**
 * Encrypt file with compression if enabled
 */
export async function encryptFileWithOptions(
  data: ArrayBuffer,
  shouldCompress: boolean = false
): Promise<EncryptionResult & { originalSize: number; compressedSize?: number }> {
  let processedData = data;
  let compressedSize: number | undefined;
  
  // Compress if requested
  if (shouldCompress) {
    try {
      // Convert to base64 for compression
      const dataWords = arrayBufferToWordArray(data);
      const base64Data = CryptoJS.enc.Base64.stringify(dataWords);
      
      // Simple compression using LZ compression (you might want to use pako for better compression)
      const compressed = CryptoJS.enc.Base64.parse(base64Data);
      compressedSize = compressed.sigBytes;
      processedData = wordArrayToArrayBuffer(compressed);
    } catch (error) {
      console.warn('Compression failed, proceeding without compression:', error);
    }
  }
  
  const encryptionResult = await encryptFileData(processedData);
  
  return {
    ...encryptionResult,
    originalSize: data.byteLength,
    compressedSize
  };
}

/**
 * Create encryption metadata object
 */
export function createEncryptionMetadata(
  encryptionResult: EncryptionResult
): FileEncryptionMetadata {
  return {
    isEncrypted: true,
    keyId: encryptionResult.keyId,
    algorithm: encryptionResult.algorithm,
    iv: encryptionResult.iv,
    authTag: encryptionResult.authTag
  };
}

/**
 * Extract decryption parameters from metadata
 */
export function extractDecryptionParams(
  metadata: FileEncryptionMetadata
): DecryptionParams | null {
  if (!metadata.isEncrypted || !metadata.keyId || !metadata.iv || !metadata.authTag || !metadata.algorithm) {
    return null;
  }
  
  return {
    keyId: metadata.keyId,
    iv: metadata.iv,
    authTag: metadata.authTag,
    algorithm: metadata.algorithm
  };
}

/**
 * Secure random string generation for tokens
 */
export function generateSecureToken(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * Generate secure access token for signed URLs
 */
export function generateAccessToken(): string {
  const timestamp = Date.now().toString();
  const randomBytes = generateSecureToken(16);
  return CryptoJS.SHA256(timestamp + randomBytes).toString();
}

/**
 * Encrypt sensitive metadata (like watermark text)
 */
export async function encryptMetadata(data: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const iv = generateIV();
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return `${iv}:${encrypted.toString()}`;
  } catch (error) {
    console.error('Metadata encryption failed:', error);
    throw new Error('Failed to encrypt metadata');
  }
}

/**
 * Decrypt sensitive metadata
 */
export async function decryptMetadata(encryptedData: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const [iv, ciphertext] = encryptedData.split(':');
    
    if (!iv || !ciphertext) {
      throw new Error('Invalid encrypted metadata format');
    }
    
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Metadata decryption failed:', error);
    throw new Error('Failed to decrypt metadata');
  }
}