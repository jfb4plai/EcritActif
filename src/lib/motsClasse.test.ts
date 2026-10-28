import { describe, expect, test, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { modifierMotsClasse } from './enseignant';

function dbFactice(erreur: unknown = null) {
  const eq = vi.fn(async () => ({ error: erreur }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { db: { from } as unknown as SupabaseClient, from, update, eq };
}

describe('modifierMotsClasse', () => {
  test('écrit la liste nettoyée (doublons ignorés) dans ecrit_classes.mots_acceptes de la bonne classe', async () => {
    const { db, from, update, eq } = dbFactice();
    const r = await modifierMotsClasse(db, 'cl1', 'Cointe, cointe; Outremeuse');
    expect(r).toEqual(['Cointe', 'Outremeuse']);
    expect(from).toHaveBeenCalledWith('ecrit_classes');
    expect(update).toHaveBeenCalledWith({ mots_acceptes: ['Cointe', 'Outremeuse'] });
    expect(eq).toHaveBeenCalledWith('id', 'cl1');
  });
  test('saisie vide : la liste est vidée', async () => {
    const { db, update } = dbFactice();
    expect(await modifierMotsClasse(db, 'cl1', '  ')).toEqual([]);
    expect(update).toHaveBeenCalledWith({ mots_acceptes: [] });
  });
  test('expression refusée, rien n’est écrit', async () => {
    const { db, update } = dbFactice();
    await expect(modifierMotsClasse(db, 'cl1', 'tunnel de la Meuse')).rejects.toThrow('Mots non reconnus : tunnel de la Meuse');
    expect(update).not.toHaveBeenCalled();
  });
  test('erreur de la base : propagée', async () => {
    const { db } = dbFactice(new Error('rls'));
    await expect(modifierMotsClasse(db, 'cl1', 'Cointe')).rejects.toThrow('rls');
  });
});
