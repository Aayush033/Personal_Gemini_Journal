import { describe, it, expect } from 'vitest';
import { JOURNAL_PERSONAS } from '../src/lib/personas';

describe('Multi-Persona Socratic Reasoning Engine', () => {
  it('contains all 5 specialized inquiry personas', () => {
    expect(JOURNAL_PERSONAS).toHaveLength(5);
    const personaIds = JOURNAL_PERSONAS.map((p) => p.id);
    expect(personaIds).toContain('socratic');
    expect(personaIds).toContain('clarity');
    expect(personaIds).toContain('empathy');
    expect(personaIds).toContain('catalyst');
    expect(personaIds).toContain('stoic');
  });

  it('validates each persona has valid roleTitle, description, and starter prompts', () => {
    for (const persona of JOURNAL_PERSONAS) {
      expect(persona.name.length).toBeGreaterThan(0);
      expect(persona.roleTitle.length).toBeGreaterThan(0);
      expect(persona.description.length).toBeGreaterThan(0);
      expect(persona.systemPrompt.length).toBeGreaterThan(50);
      expect(Array.isArray(persona.starterPrompts)).toBe(true);
      expect(persona.starterPrompts.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('verifies Socratic persona emphasizes blindspot detection and questioning', () => {
    const socratic = JOURNAL_PERSONAS.find((p) => p.id === 'socratic');
    expect(socratic).toBeDefined();
    expect(socratic?.systemPrompt).toContain('Socratic');
    expect(socratic?.systemPrompt).toContain('blind spots');
  });

  it('verifies Stoic persona emphasizes locus of control and equanimity', () => {
    const stoic = JOURNAL_PERSONAS.find((p) => p.id === 'stoic');
    expect(stoic).toBeDefined();
    expect(stoic?.systemPrompt).toContain('Stoic');
    expect(stoic?.systemPrompt).toContain('control');
  });
});
