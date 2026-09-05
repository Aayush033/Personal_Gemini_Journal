/**
 * Zero-Knowledge Client-Side Cryptographic Utilities
 * Uses Web Crypto API (AES-GCM-256 with PBKDF2 Key Derivation)
 * Ensures user journal entries can be encrypted before cloud transmission.
 */

const PBKDF2_ITERATIONS = 100_000;

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('Web Crypto API is not available in this environment');
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoObj = getCrypto();
  const enc = new TextEncoder();
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  iv: string; // base64
  salt: string; // base64
  ciphertext: string; // base64
  version: number;
}

export async function encryptJournalData(data: any, passkey: string): Promise<string> {
  const cryptoObj = getCrypto();
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));
  
  // Generate random IV and Salt
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  
  const key = await deriveKey(passkey, salt);
  const cipherBuffer = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  const payload: EncryptedPayload = {
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
    version: 1,
  };

  return JSON.stringify(payload);
}

export async function decryptJournalData<T = any>(encryptedString: string, passkey: string): Promise<T> {
  try {
    const cryptoObj = getCrypto();
    const payload: EncryptedPayload = JSON.parse(encryptedString);
    const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(payload.salt), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(payload.ciphertext), (c) => c.charCodeAt(0));

    const key = await deriveKey(passkey, salt);
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const plaintext = dec.decode(decryptedBuffer);
    return JSON.parse(plaintext);
  } catch (err) {
    throw new Error('Decryption failed. Invalid passkey or corrupted data.');
  }
}
