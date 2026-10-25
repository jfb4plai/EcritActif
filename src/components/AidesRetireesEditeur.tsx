import { useState } from 'react';
import { AIDES, type AideId } from '../lib/aides';

type Retrait = { id: AideId; raison: string };

// Permet à l'enseignant de retirer ou de rétablir une aide sur une activité déjà créée, y compris pendant
// que des élèves écrivent : l'élève voit la raison à sa prochaine sauvegarde.
export default function AidesRetireesEditeur({ initial, onEnregistrer }: { initial: Retrait[]; onEnregistrer: (r: Retrait[]) => void }) {
  const [retirees, setRetirees] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((r) => [r.id, r.raison])));
  const incomplet = Object.values(retirees).some((r) => r.trim() === '');

  return (
    <div>
      {AIDES.map((a) => (
        <div key={a.id}>
          <label className="block">
            <input
              type="checkbox"
              aria-label={`Retirer : ${a.libelle}`}
              checked={a.id in retirees}
              onChange={(e) => {
                const suite = { ...retirees };
                if (e.target.checked) suite[a.id] = '';
                else delete suite[a.id];
                setRetirees(suite);
              }}
            />{' '}
            {a.libelle}
          </label>
          {a.id in retirees && (
            <input
              aria-label={`Raison du retrait : ${a.libelle}`}
              className="plai-input"
              value={retirees[a.id]}
              onChange={(e) => setRetirees({ ...retirees, [a.id]: e.target.value })}
              placeholder="On vérifie le geste d’écrire à la main."
            />
          )}
        </div>
      ))}
      <button type="button" className="plai-btn" disabled={incomplet} onClick={() => onEnregistrer(Object.entries(retirees).map(([id, raison]) => ({ id: id as AideId, raison: raison.trim() })))}>
        Enregistrer les aides retirées
      </button>
    </div>
  );
}
