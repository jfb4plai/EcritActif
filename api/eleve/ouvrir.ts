import { depotSupabase } from '../_lib/depot.js';
import { ouvrirEleve } from '../_lib/eleve.js';
import { creerLimiteur } from '../_lib/limite.js';

const autorise = creerLimiteur(10, 60_000);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'Méthode non autorisée' });
  const secret = process.env.ECRIT_SESSION_SECRET;
  if (!secret) return res.status(500).json({ erreur: 'Erreur serveur' });
  const ip = String(req.headers?.['x-forwarded-for'] ?? 'inconnue').split(',')[0].trim();
  if (!autorise(ip)) return res.status(429).json({ erreur: 'Trop d’essais, réessaie dans une minute.' });
  try {
    const r = await ouvrirEleve(depotSupabase(), secret, req.body);
    return res.status(r.status).json(r.corps);
  } catch {
    // Aucun détail ni texte d'élève dans les journaux.
    return res.status(500).json({ erreur: 'Erreur serveur' });
  }
}
