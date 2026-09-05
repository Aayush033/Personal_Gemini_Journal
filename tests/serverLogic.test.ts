import { describe, it, expect } from 'vitest';

describe('Server-Side Security & Model Routing Logic', () => {
  const allowedModels = [
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
  ];

  function resolveModel(requestedModel?: string): string {
    return requestedModel && allowedModels.includes(requestedModel)
      ? requestedModel
      : 'gemini-3.7-flash';
  }

  function sanitizeMessages(messages: any[]): { role: 'user' | 'model'; text: string }[] {
    if (!Array.isArray(messages)) return [];
    return messages.slice(-20).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      text: String(msg.text || '').substring(0, 10000),
    }));
  }

  it('defaults to gemini-3.7-flash when no model is requested', () => {
    expect(resolveModel()).toBe('gemini-3.7-flash');
    expect(resolveModel(undefined)).toBe('gemini-3.7-flash');
  });

  it('safely resolves allowed models and rejects unsupported/deprecated models', () => {
    expect(resolveModel('gemini-3.7-flash')).toBe('gemini-3.7-flash');
    expect(resolveModel('gemini-3.1-pro-preview')).toBe('gemini-3.1-pro-preview');
    expect(resolveModel('gemini-3.1-flash-lite')).toBe('gemini-3.1-flash-lite');
    expect(resolveModel('gemini-flash-latest')).toBe('gemini-flash-latest');

    // Deprecated model should safely fallback
    expect(resolveModel('gemini-2.5-flash')).toBe('gemini-3.7-flash');
    expect(resolveModel('gemini-1.5-pro')).toBe('gemini-3.7-flash');
  });

  it('sanitizes input message length and enforces max 20 turn buffer', () => {
    const hugeMessage = 'A'.repeat(15000);
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'model',
      text: i === 29 ? hugeMessage : `Message ${i}`,
    }));

    const sanitized = sanitizeMessages(messages);
    expect(sanitized.length).toBe(20);
    expect(sanitized[sanitized.length - 1].text.length).toBe(10000);
  });

  describe('Vector Embeddings & Cosine Similarity', () => {
    function cosineSimilarity(vecA: number[], vecB: number[]): number {
      if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
      const len = Math.min(vecA.length, vecB.length);
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < len; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    it('calculates 1.0 for identical vector embeddings', () => {
      const vec = [0.12, -0.45, 0.88, 0.31];
      const similarity = cosineSimilarity(vec, vec);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('calculates 0.0 for orthogonal vector embeddings', () => {
      const vecA = [1, 0, 0, 0];
      const vecB = [0, 1, 0, 0];
      expect(cosineSimilarity(vecA, vecB)).toBe(0);
    });

    it('calculates -1.0 for diametrically opposite vector embeddings', () => {
      const vecA = [0.5, 0.5];
      const vecB = [-0.5, -0.5];
      expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1.0, 5);
    });

    it('handles empty or zero magnitude vectors gracefully without division by zero', () => {
      expect(cosineSimilarity([], [])).toBe(0);
      expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
      expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
    });
  });

  describe('Google Search Grounding Parsing', () => {
    function extractGrounding(candidate: any) {
      const groundingMetadata = candidate?.groundingMetadata;
      const webSearchQueries: string[] = groundingMetadata?.webSearchQueries || [];
      const groundingChunks = groundingMetadata?.groundingChunks || [];
      const sources: { title: string; uri: string }[] = [];

      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
          });
        }
      }
      return { webSearchQueries, sources, groundingMetadata };
    }

    it('extracts web citations and search queries from candidate grounding metadata', () => {
      const mockCandidate = {
        groundingMetadata: {
          webSearchQueries: ['AI market trends 2026', 'journaling psychology research'],
          groundingChunks: [
            { web: { title: 'Psychology Today', uri: 'https://psychologytoday.com/reflection' } },
            { web: { title: 'Nature Neuroscience', uri: 'https://nature.com/articles/mindfulness' } },
          ],
        },
      };

      const result = extractGrounding(mockCandidate);
      expect(result.webSearchQueries).toHaveLength(2);
      expect(result.sources).toHaveLength(2);
      expect(result.sources[0].title).toBe('Psychology Today');
      expect(result.sources[0].uri).toBe('https://psychologytoday.com/reflection');
    });

    it('handles missing or malformed candidate metadata safely', () => {
      const result = extractGrounding({});
      expect(result.sources).toEqual([]);
      expect(result.webSearchQueries).toEqual([]);
    });
  });
});
