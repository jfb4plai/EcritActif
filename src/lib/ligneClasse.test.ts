import { describe, expect, test } from 'vitest';
import { ligneClasse } from './enseignant';

describe('ligneClasse : ce qui est écrit en base pour une nouvelle classe', () => {
  test('le niveau choisi est enregistré avec la classe', () => {
    expect(ligneClasse('u1', '4e primaire', 'ABC234', 'P4')).toEqual({ user_id: 'u1', nom: '4e primaire', code_classe: 'ABC234', niveau: 'P4' });
  });

  test('le nom est nettoyé', () => {
    expect(ligneClasse('u1', '  3e A  ', 'ABC234', 'P3').nom).toBe('3e A');
  });

  test('un niveau absent ou invalide est refusé : une classe neuve a toujours un niveau', () => {
    expect(() => ligneClasse('u1', 'x', 'ABC234', '' as never)).toThrow(/niveau/i);
    expect(() => ligneClasse('u1', 'x', 'ABC234', 'P9' as never)).toThrow(/niveau/i);
  });
});
