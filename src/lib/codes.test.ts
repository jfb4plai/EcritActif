import { describe, expect, test } from 'vitest';
import { ALPHABET_CODE, genererCode } from './codes';

describe('codes élève et classe', () => {
  test('l’alphabet exclut les caractères ambigus 0 O 1 I L', () => {
    for (const c of ['0', 'O', '1', 'I', 'L']) expect(ALPHABET_CODE).not.toContain(c);
  });

  test('un code fait 6 caractères par défaut, tous dans l’alphabet', () => {
    for (let i = 0; i < 500; i++) {
      const code = genererCode();
      expect(code).toHaveLength(6);
      for (const ch of code) expect(ALPHABET_CODE).toContain(ch);
    }
  });

  test('la longueur est réglable', () => {
    expect(genererCode(8)).toHaveLength(8);
  });

  test('deux codes successifs diffèrent (aléatoire)', () => {
    const codes = new Set(Array.from({ length: 200 }, () => genererCode()));
    expect(codes.size).toBeGreaterThan(190);
  });
});
