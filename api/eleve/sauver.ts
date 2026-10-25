import { depotSupabase } from '../_lib/depot.js';
import { sauverTexte } from '../_lib/eleve.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'Méthode non autorisée' });
  const secret = process.env.ECRIT_SESSION_SECRET;
  if (!secret) return res.status(500).json({ erreur: 'Erreur serveur' });
  try {
    const r = await sauverTexte(depotSupabase(), secret, req.body);
    return res.status(r.status).json(r.corps);
  } catch {
    return res.status(500).json({ erreur: 'Erreur serveur' });
  }
}
