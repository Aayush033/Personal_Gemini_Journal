import { describe, it, expect } from 'vitest';
import { WisdomSummary } from '../src/types';

describe('Wisdom Matrix Summarization Parser & Normalizer', () => {
  function parseAndNormalizeSummary(responseText: string): WisdomSummary {
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems.map((item: any, idx: number) => ({
          id: item.id || `act-${idx}`,
          text: item.text || String(item),
          completed: !!item.completed,
          priority: item.priority || 'medium',
        }))
      : [];

    return {
      title: parsed.title || 'Untitled Reflection',
      oneLiner: parsed.oneLiner || '',
      executiveSummary: parsed.executiveSummary || '',
      keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
      actionItems,
      moodValence: parsed.moodValence || 'reflective',
      moodScore: Number(parsed.moodScore) || 75,
      cognitiveThemes: Array.isArray(parsed.cognitiveThemes) ? parsed.cognitiveThemes : [],
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
      socraticQuestion: parsed.socraticQuestion || '',
      clarityScore: Number(parsed.clarityScore) || 80,
    };
  }

  it('correctly parses pristine JSON responses from Gemini', () => {
    const rawJson = JSON.stringify({
      title: 'Architectural Blueprint Review',
      oneLiner: 'Clear isolation yields scalable security.',
      executiveSummary: 'We examined multi-tenant boundaries and WebCrypto keys.',
      keyInsights: ['Zero-trust default deny is crucial', 'WebCrypto protects at rest'],
      actionItems: [{ text: 'Deploy firestore.rules', priority: 'high', completed: false }],
      moodValence: 'determined',
      moodScore: 88,
      cognitiveThemes: ['Security', 'Architecture'],
      suggestedTags: ['security', 'cloud'],
      socraticQuestion: 'How can we automate key rotation?',
      clarityScore: 95,
    });

    const summary = parseAndNormalizeSummary(rawJson);
    expect(summary.title).toBe('Architectural Blueprint Review');
    expect(summary.clarityScore).toBe(95);
    expect(summary.actionItems).toHaveLength(1);
    expect(summary.actionItems[0].priority).toBe('high');
    expect(summary.moodValence).toBe('determined');
  });

  it('handles and strips markdown code fences safely (```json wrapping)', () => {
    const markdownWrapped = `\`\`\`json
{
  "title": "Stoic Reflection",
  "oneLiner": "Focus on the controllable inputs.",
  "executiveSummary": "Examined daily routines and emotional equilibrium.",
  "keyInsights": ["Accept volatility", "Protect morning focus"],
  "actionItems": ["Block 2h deep work"],
  "moodValence": "calm",
  "moodScore": 85,
  "clarityScore": 90
}
\`\`\``;

    const summary = parseAndNormalizeSummary(markdownWrapped);
    expect(summary.title).toBe('Stoic Reflection');
    expect(summary.moodValence).toBe('calm');
    expect(summary.actionItems[0].text).toBe('Block 2h deep work');
  });
});
