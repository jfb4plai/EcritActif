import { afterEach, describe, expect, test, vi } from 'vitest';
import { lireLocal, sauverLocal } from './brouillonLocal';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('brouillon local', () => {
  test('écrit puis relit un texte', () => {
    sauverLocal('ecrit:act1', 'Mon chat dort.');
    expect(lireLocal('ecrit:act1')).toBe('Mon chat dort.');
  });

  test('clé absente : null', () => {
    expect(lireLocal('ecrit:rien')).toBeNull();
  });

  test('ne lève jamais quand le stockage est interdit (navigation privée, données bloquées)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => sauverLocal('k', 'x')).not.toThrow();
    expect(lireLocal('k')).toBeNull();
  });
});
