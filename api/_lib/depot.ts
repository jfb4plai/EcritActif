import { createClient } from '@supabase/supabase-js';
import type { ActiviteBrute, Depot, EleveBrut } from './eleve.js';

// Dépôt réel (clé service_role, côté serveur uniquement). Non couvert par les tests unitaires :
// il se vérifie à la tâche 16 avec la migration appliquée.
export function depotSupabase(): Depot {
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) throw new Error('Configuration Supabase manquante');
  const db = createClient(url, cle, { auth: { persistSession: false } });

  const versActivite = (r: Record<string, any>): ActiviteBrute => ({
    id: r.id,
    classeId: r.classe_id,
    annee: r.annee,
    consigne: r.consigne,
    contraintes: r.contraintes ?? {},
    itemIds: r.item_ids ?? [],
    principeIds: r.principe_ids ?? [],
    categories: r.categories ?? [],
    aidesRetirees: r.aides_retirees ?? [],
    banqueMots: r.banque_mots ?? [],
    principesPerso: r.principes_perso ?? [],
    atelier: r.atelier === true,
  });
  const versEleve = (r: Record<string, any>): EleveBrut => ({ id: r.id, aides: r.aides ?? [] });

  return {
    async classeParCode(code) {
      const { data, error } = await db.from('ecrit_classes').select('id').eq('code_classe', code).maybeSingle();
      if (error) throw error;
      return data ? { id: data.id } : null;
    },
    async eleveParCode(classeId, code) {
      const { data, error } = await db.from('ecrit_eleves').select('id, aides').eq('classe_id', classeId).eq('code_eleve', code).maybeSingle();
      if (error) throw error;
      return data ? versEleve(data) : null;
    },
    async eleve(id) {
      const { data, error } = await db.from('ecrit_eleves').select('id, aides').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? versEleve(data) : null;
    },
    async activites(classeId) {
      const { data, error } = await db.from('ecrit_activites').select('*').eq('classe_id', classeId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(versActivite);
    },
    async activite(id) {
      const { data, error } = await db.from('ecrit_activites').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? versActivite(data) : null;
    },
    async dernierTexte(eleveId, activiteId) {
      const { data, error } = await db
        .from('ecrit_textes')
        .select('texte, version, phase')
        .eq('eleve_id', eleveId)
        .eq('activite_id', activiteId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? { texte: data.texte, version: data.version, phase: data.phase } : null;
    },
    async enregistrer(t) {
      const { error } = await db
        .from('ecrit_textes')
        .upsert({ activite_id: t.activiteId, eleve_id: t.eleveId, version: t.version, texte: t.texte, phase: t.phase, updated_at: new Date().toISOString(), ...(t.autoEvaluation ? { auto_evaluation: t.autoEvaluation } : {}) }, { onConflict: 'activite_id,eleve_id,version' });
      if (error) throw error;
      if (t.evenements.length > 0) {
        const { error: e2 } = await db
          .from('ecrit_traces')
          .insert(t.evenements.map((evenement) => ({ eleve_id: t.eleveId, activite_id: t.activiteId, phase: t.phase, evenement })));
        if (e2) throw e2;
      }
    },
  };
}
