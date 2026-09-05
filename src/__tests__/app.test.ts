import { describe, it, expect } from 'vitest';
import { generateIcsCalendarFile } from '../lib/calendarExport';
import { encryptJournalData, decryptJournalData } from '../lib/crypto';
import { JOURNAL_PERSONAS } from '../lib/personas';
import { ActionItem } from '../types';

describe('Personal Gemini Journal - Core Test Suite', () => {
  describe('Zero-Knowledge Client-Side AES-GCM-256 Crypto', () => {
    it('should correctly encrypt and decrypt journal payload with passkey', async () => {
      const payload = {
        title: 'Deep Work Reflection',
        rawConversation: [{ id: '1', role: 'user', text: 'Working on RAG engine', timestamp: Date.now() }],
        summary: {
          title: 'Deep Work Reflection',
          oneLiner: 'Focusing on strategic architecture',
          executiveSummary: 'User designed semantic memory and deliberation panels.',
          clarityScore: 95,
          moodValence: 'optimistic',
          moodScore: 90,
          keyInsights: ['Architectural clarity unlocks rapid development'],
          actionItems: [],
          socraticQuestion: 'What is the highest priority next step?',
          suggestedTags: ['deep-work', 'engineering'],
        },
      };

      const passkey = 'SuperSecretPasskey_2026!';
      const encryptedString = await encryptJournalData(payload, passkey);

      expect(encryptedString).toBeDefined();
      expect(typeof encryptedString).toBe('string');
      
      const parsed = JSON.parse(encryptedString);
      expect(parsed.ciphertext).toBeDefined();
      expect(parsed.iv).toBeDefined();
      expect(parsed.salt).toBeDefined();

      const decryptedPayload = await decryptJournalData(encryptedString, passkey);
      expect(decryptedPayload.title).toBe(payload.title);
      expect(decryptedPayload.summary.clarityScore).toBe(95);
      expect(decryptedPayload.rawConversation.length).toBe(1);
    });

    it('should reject decryption with incorrect passkey', async () => {
      const payload = { secret: 'Confidential thoughts' };
      const encryptedString = await encryptJournalData(payload, 'RightPasskey123');

      await expect(
        decryptJournalData(encryptedString, 'WrongPasskey456')
      ).rejects.toThrow();
    });
  });

  describe('Calendar & Task Integration (.ICS generator)', () => {
    it('should format valid standard RFC-5545 iCalendar data from action items', () => {
      const actionItems: ActionItem[] = [
        {
          id: 'act-1',
          text: 'Ship production multi-agent deliberation panel',
          completed: false,
          priority: 'high',
        },
        {
          id: 'act-2',
          text: 'Review longitudinal semantic memory trends',
          completed: false,
          priority: 'medium',
        },
      ];

      const ics = generateIcsCalendarFile(
        'Sprint Strategic Planning',
        actionItems,
        'Executive summary of sprint goals'
      );

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//Google AI Studio//Personal Gemini Journal//EN');
      expect(ics).toContain('Ship production multi-agent deliberation panel');
      expect(ics).toContain('Review longitudinal semantic memory trends');
      expect(ics).toContain('PRIORITY:1'); // high priority maps to 1
      expect(ics).toContain('PRIORITY:5'); // medium priority maps to 5
      expect(ics).toContain('END:VCALENDAR');
    });

    it('should handle empty action items gracefully', () => {
      const ics = generateIcsCalendarFile('Empty Test', [], 'No actions');
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).not.toContain('BEGIN:VEVENT');
    });
  });

  describe('Journal Personas Configuration', () => {
    it('should define distinct cognitive personas including Socratic, Stoic, Clarity, and Mindful', () => {
      expect(JOURNAL_PERSONAS.length).toBeGreaterThanOrEqual(4);

      const socratic = JOURNAL_PERSONAS.find((p) => p.id === 'socratic');
      const stoic = JOURNAL_PERSONAS.find((p) => p.id === 'stoic');
      const clarity = JOURNAL_PERSONAS.find((p) => p.id === 'clarity');

      expect(socratic).toBeDefined();
      expect(socratic?.name).toBe('Socratic Mirror');
      expect(stoic?.name).toBe('Stoic Mentor');
      expect(clarity?.name).toBe('Strategic Clarity Coach');

      JOURNAL_PERSONAS.forEach((persona) => {
        expect(persona.systemPrompt).toBeDefined();
        expect(persona.systemPrompt.length).toBeGreaterThan(20);
        expect(persona.starterPrompts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Gemini Error Formatter', () => {
    it('should format 429 RESOURCE_EXHAUSTED into helpful guidance', async () => {
      const { formatGeminiErrorMessage } = await import('../../server');
      const errorObj = {
        message: '{"error": {"code": 429, "message": "You exceeded your current quota", "status": "RESOURCE_EXHAUSTED"}}',
      };
      const formatted = formatGeminiErrorMessage(errorObj);
      expect(formatted).toContain('429 RESOURCE_EXHAUSTED');
      expect(formatted).toContain('aistudio.google.com');
    });

    it('should format 503 UNAVAILABLE high demand into resilient advice', async () => {
      const { formatGeminiErrorMessage } = await import('../../server');
      const errorObj = {
        message: '{"error": {"code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.", "status": "UNAVAILABLE"}}',
      };
      const formatted = formatGeminiErrorMessage(errorObj);
      expect(formatted).toContain('503 UNAVAILABLE');
      expect(formatted).toContain('high global demand');
    });
  });
});
