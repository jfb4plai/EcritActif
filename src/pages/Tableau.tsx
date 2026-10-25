import { AIDES } from '../lib/aides';
import { statutParItem } from '../lib/statut';
import type { Annee, ItemCecp, Phase } from '../types';

export interface LigneEleve {
  id: string;
  code: string;
  dernierePhase: Phase | null;
  versions: number;
  aides: string[];
  itemsTravailles: string[];
}

interface Props {
  annee: Annee;
  items: ItemCecp[];
  eleves: LigneEleve[];
  activites: { id: string; itemIds: string[] }[];
  validations: { eleveId: string; itemId: string }[];
  onValider: (eleveId: string, itemId: string) => void;
}

const PHASES: Record<Phase, string> = { reflechir: 'Réfléchir', ecrire: 'Écrire', relire: 'Relire', corriger: 'Corriger' };

export default function Tableau({ annee, items, eleves, activites, validations, onValider }: Props) {
  const statuts = statutParItem(items, activites, validations, eleves.map((e) => e.id));
  const libelleAide = (id: string) => AIDES.find((a) => a.id === id)?.libelle ?? id;
  const itemParId = (id: string) => items.find((i) => i.id === id);
  const valide = (eleveId: string, itemId: string) => validations.some((v) => v.eleveId === eleveId && v.itemId === itemId);

  return (
    <div className="space-y-6">
      <section aria-label="Élèves">
        <h2>Élèves (codes anonymes)</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Où il en est</th>
              <th>Aides utilisées</th>
              <th>Items travaillés</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map((e) => (
              <tr key={e.id}>
                <td>{e.code}</td>
                <td>
                  {e.dernierePhase ? (
                    <>
                      <span>{PHASES[e.dernierePhase]}</span> · {e.versions} version{e.versions > 1 ? 's' : ''}
                    </>
                  ) : (
                    'Pas encore commencé'
                  )}
                </td>
                <td>{e.aides.length > 0 ? e.aides.map(libelleAide).join(' ; ') : 'Aucune'}</td>
                <td>
                  {e.itemsTravailles.map((id) => {
                    const item = itemParId(id);
                    if (!item) return null;
                    return (
                      <div key={id}>
                        {item.codes.join(', ')} : {item.contenu}{' '}
                        {valide(e.id, id) ? (
                          <strong>Validé</strong>
                        ) : (
                          <button type="button" className="plai-btn" onClick={() => onValider(e.id, id)}>
                            Valider cet item pour cet élève
                          </button>
                        )}
                      </div>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-label={`Programme ${annee}`}>
        <h2>Programme CECP {annee}, écrire</h2>
        <p className="text-sm">L’app présente les traces. Vous seul décidez qu’un item est acquis.</p>
        <ul>
          {items.map((i) => {
            const s = statuts[i.id];
            return (
              <li key={i.id}>
                {i.codes.join(', ')} : {i.contenu} —{' '}
                {s.statut === 'non-vu' ? 'Pas encore travaillé' : s.statut === 'valide' ? `Validé pour toute la classe` : `Travaillé · ${s.nbValides} sur ${eleves.length} validé${s.nbValides > 1 ? 's' : ''}`}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
