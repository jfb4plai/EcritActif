import { verifierEssai, type Verdict } from '../../src/lib/chasse.js';
import { enObjet, erreur, EVENEMENT_MAX, type Depot, type Reponse } from './eleve.js';
import { verifierJeton } from './session.js';

export const FORME_MAX = 60;
export const JUSTIFICATION_MAX = 300;

// Vérification d'un essai de la chasse : le corrigé ne quitte jamais le serveur. Réponse qualitative, jamais une note.
// Les traces gardent le numéro de l'erreur et le verdict, jamais le mot cliqué ni la forme proposée.
export async function essaiChasse(depot: Depot, secret: string, body: unknown): Promise<Reponse<Verdict>> {
  const b = enObjet(body);
  if (
    !b ||
    typeof b.jeton !== 'string' ||
    typeof b.activiteId !== 'string' ||
    !Number.isInteger(b.motIndex) ||
    (b.motIndex as number) < 0 ||
    typeof b.forme !== 'string' ||
    b.forme.length > FORME_MAX ||
    (b.justification !== undefined && (typeof b.justification !== 'string' || b.justification.length > JUSTIFICATION_MAX))
  ) {
    return erreur(400, 'Demande incomplète');
  }
  const session = verifierJeton(b.jeton, secret);
  if (!session) return erreur(401, 'Session expirée');
  const activite = await depot.activite(b.activiteId);
  if (!activite || activite.classeId !== session.classeId || !activite.chasse) return erreur(404, 'Activité inconnue');
  const verdict = verifierEssai(activite.chasse, { motIndex: b.motIndex as number, forme: b.forme });
  const evenements = [verdict.resultat === 'pas-erreur' ? 'chasse:essai:pas-erreur' : `chasse:essai:e${verdict.erreurId}:${verdict.resultat}`];
  const justification = typeof b.justification === 'string' ? b.justification.trim() : '';
  if (verdict.resultat !== 'pas-erreur' && justification !== '') evenements.push(`chasse:justification:e${verdict.erreurId}:${justification}`.slice(0, EVENEMENT_MAX));
  await depot.tracer(session.eleveId, activite.id, 'corriger', evenements);
  return { status: 200, corps: verdict };
}
