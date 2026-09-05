import { describe, it, expect } from 'vitest';
import { encryptJournalData, decryptJournalData } from '../src/lib/crypto';

describe('Zero-Knowledge WebCrypto AES-GCM-256 Engine', () => {
  const sampleEntry = {
    title: 'Cognitive Reflection on Strategy',
    rawConversation: [
      { id: '1', role: 'user', text: 'I am planning a major career transition.' },
      { id: '2', role: 'model', text: 'What is the highest-leverage first step?' },
    ],
    summary: {
      oneLiner: 'Transition requires deliberate pacing.',
      clarityScore: 92,
      moodValence: 'determined',
    },
  };

  const validPasskey = 'MasterSecret#2026!Pass';

  it('successfully encrypts plain journal entry into structured JSON payload', async () => {
    const cipherTextJson = await encryptJournalData(sampleEntry, validPasskey);
    expect(typeof cipherTextJson).toBe('string');

    const parsed = JSON.parse(cipherTextJson);
    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('salt');
    expect(parsed).toHaveProperty('ciphertext');
    expect(parsed).toHaveProperty('version');
    expect(parsed.version).toBe(1);

    // Ensure plaintext is not exposed in ciphertext
    expect(cipherTextJson).not.toContain('Cognitive Reflection');
    expect(cipherTextJson).not.toContain('career transition');
  });

  it('accurately decrypts ciphertext using the matching passkey', async () => {
    const cipherTextJson = await encryptJournalData(sampleEntry, validPasskey);
    const decrypted = await decryptJournalData(cipherTextJson, validPasskey);

    expect(decrypted).toEqual(sampleEntry);
    expect(decrypted.title).toBe(sampleEntry.title);
    expect(decrypted.summary.clarityScore).toBe(92);
  });

  it('rejects decryption when an incorrect passkey is supplied', async () => {
    const cipherTextJson = await encryptJournalData(sampleEntry, validPasskey);

    await expect(
      decryptJournalData(cipherTextJson, 'WrongPasskey123')
    ).rejects.toThrow(/Decryption failed/);
  });

  it('rejects decryption if ciphertext has been tampered with', async () => {
    const cipherTextJson = await encryptJournalData(sampleEntry, validPasskey);
    const parsed = JSON.parse(cipherTextJson);

    // Tamper with ciphertext by altering a base64 character
    const tamperedCipher =
      parsed.ciphertext.slice(0, -4) + 'AAAA';
    const tamperedPayload = JSON.stringify({ ...parsed, ciphertext: tamperedCipher });

    await expect(
      decryptJournalData(tamperedPayload, validPasskey)
    ).rejects.toThrow(/Decryption failed/);
  });
});
