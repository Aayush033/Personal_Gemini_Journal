import { describe, it, expect } from 'vitest';
import { THREAT_MODEL_ITEMS, OWASP_LLM_DEFENSES } from '../src/lib/threatModelData';

describe('Enterprise Threat Modeling & OWASP LLM Defense Matrix', () => {
  it('covers all 6 STRIDE threat modeling pillars', () => {
    const strideCategories = new Set(THREAT_MODEL_ITEMS.map((item) => item.stride));
    expect(strideCategories.has('Spoofing')).toBe(true);
    expect(strideCategories.has('Tampering')).toBe(true);
    expect(strideCategories.has('Repudiation')).toBe(true);
    expect(strideCategories.has('Information Disclosure')).toBe(true);
    expect(strideCategories.has('Denial of Service')).toBe(true);
    expect(strideCategories.has('Elevation of Privilege')).toBe(true);
  });

  it('validates each threat model item has actionable mitigation controls', () => {
    expect(THREAT_MODEL_ITEMS.length).toBeGreaterThanOrEqual(6);
    for (const item of THREAT_MODEL_ITEMS) {
      expect(item.component).toBeTruthy();
      expect(item.threatDescription).toBeTruthy();
      expect(item.mitigationControl).toBeTruthy();
      expect(item.enforcementLayer).toBeTruthy();
      expect(item.status).toBe('enforced');
    }
  });

  it('verifies OWASP LLM defenses include Prompt Injection (LLM01) and Sensitive Data Exposure (LLM06)', () => {
    const ids = OWASP_LLM_DEFENSES.map((d) => d.id);
    expect(ids).toContain('LLM01');
    expect(ids).toContain('LLM02');
    expect(ids).toContain('LLM06');
    expect(ids).toContain('LLM08');
  });
});
