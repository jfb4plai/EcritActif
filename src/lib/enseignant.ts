import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActiviteNouvelle } from '../pages/NouvelleActivite';
import type { LigneEleve } from '../pages/Tableau';
import type { AideId } from './aides';
import { genererCode } from './codes';
import { construireLignes } from './lignes';

// Accès aux données de l'enseignant (RLS : chaque ligne appartient à son compte).
// Couche mince, non couverte par des tests unitaires : vérifiée par le parcours réel de la tâche 16.

export interface ClasseLigne {
  id: string;
  nom: string;
  code_classe: string;
}

export interface EleveLigne {
  id: string;
  code_eleve: string;
  aides: AideId[];
}

export interface ActiviteLigne {
  id: string;
  consigne: string;
  itemIds: string[];
  aidesRetirees: { id: AideId; raison: string }[];
}

const CONFLIT = '23505';

export async function listerClasses(db: SupabaseClient): Promise<ClasseLigne[]> {
  const { data, error } = await db.from('ecrit_classes').select('id, nom, code_classe').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function creerClasse(db: SupabaseClient, userId: string, nom: string): Promise<ClasseLigne> {
  for (let essai = 0; essai < 5; essai++) {
    const { data, error } = await db.from('ecrit_classes').insert({ user_id: userId, nom, code_classe: genererCode(6) }).select('id, nom, code_classe').single();
    if (!error) return data;
    if (error.code !== CONFLIT) throw error;
  }
  throw new Error('Impossible de générer un code de classe unique.');
}

export async function listerEleves(db: SupabaseClient, classeId: string): Promise<EleveLigne[]> {
  const { data, error } = await db.from('ecrit_eleves').select('id, code_eleve, aides').eq('classe_id', classeId).order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function ajouterEleves(db: SupabaseClient, classeId: string, n: number): Promise<void> {
  const codes = new Set<string>();
  while (codes.size < n) codes.add(genererCode(6));
  const { error } = await db.from('ecrit_eleves').insert([...codes].map((code_eleve) => ({ classe_id: classeId, code_eleve })));
  if (error) throw error;
}

export async function reglerAides(db: SupabaseClient, eleveId: string, aides: AideId[]): Promise<void> {
  const { error } = await db.from('ecrit_eleves').update({ aides }).eq('id', eleveId);
  if (error) throw error;
}

export async function listerActivites(db: SupabaseClient, classeId: string): Promise<ActiviteLigne[]> {
  const { data, error } = await db.from('ecrit_activites').select('id, consigne, item_ids, aides_retirees').eq('classe_id', classeId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, consigne: r.consigne, itemIds: r.item_ids ?? [], aidesRetirees: r.aides_retirees ?? [] }));
}

export async function modifierAidesRetirees(db: SupabaseClient, activiteId: string, retirees: { id: AideId; raison: string }[]): Promise<void> {
  const { error } = await db.from('ecrit_activites').update({ aides_retirees: retirees }).eq('id', activiteId);
  if (error) throw error;
}

// Ce qui est écrit en base pour une nouvelle activité (fonction pure, testée).
export function ligneActivite(userId: string, classeId: string, a: ActiviteNouvelle) {
  return {
    classe_id: classeId,
    user_id: userId,
    annee: a.annee,
    consigne: a.consigne,
    contraintes: a.contraintes,
    item_ids: a.itemIds,
    principe_ids: a.principeIds,
    categories: a.categories,
    aides_retirees: a.aidesRetirees,
    banque_mots: a.banqueMots,
    principes_perso: a.principesPerso,
  };
}

export async function enregistrerActivite(db: SupabaseClient, userId: string, classeId: string, a: ActiviteNouvelle): Promise<void> {
  const { error } = await db.from('ecrit_activites').insert(ligneActivite(userId, classeId, a));
  if (error) throw error;
}

export async function chargerTableau(
  db: SupabaseClient,
  classeId: string,
): Promise<{ eleves: LigneEleve[]; activites: { id: string; itemIds: string[] }[]; validations: { eleveId: string; itemId: string }[] }> {
  const eleves = await listerEleves(db, classeId);
  const activites = (await listerActivites(db, classeId)).map((a) => ({ id: a.id, itemIds: a.itemIds }));
  const idsEleves = eleves.map((e) => e.id);
  if (idsEleves.length === 0) return { eleves: [], activites, validations: [] };

  const [t, tr, v] = await Promise.all([
    db.from('ecrit_textes').select('eleve_id, activite_id, version, phase, updated_at, auto_evaluation').in('eleve_id', idsEleves),
    db.from('ecrit_traces').select('eleve_id, evenement').in('eleve_id', idsEleves).or('evenement.like.aide:%,evenement.like.clarification:%'),
    db.from('ecrit_validations').select('eleve_id, item_id').in('eleve_id', idsEleves),
  ]);
  if (t.error) throw t.error;
  if (tr.error) throw tr.error;
  if (v.error) throw v.error;

  const lignes = construireLignes(
    eleves.map((e) => ({ id: e.id, code: e.code_eleve })),
    activites,
    (t.data ?? []).map((r) => ({ eleveId: r.eleve_id, activiteId: r.activite_id, version: r.version, phase: r.phase, updatedAt: r.updated_at, autoEvaluation: r.auto_evaluation ?? undefined })),
    (tr.data ?? []).map((r) => ({ eleveId: r.eleve_id, evenement: r.evenement })),
  );
  return { eleves: lignes, activites, validations: (v.data ?? []).map((r) => ({ eleveId: r.eleve_id, itemId: r.item_id })) };
}

export async function validerItem(db: SupabaseClient, userId: string, eleveId: string, itemId: string): Promise<void> {
  const { error } = await db.from('ecrit_validations').upsert({ eleve_id: eleveId, item_id: itemId, user_id: userId }, { onConflict: 'eleve_id,item_id' });
  if (error) throw error;
}
