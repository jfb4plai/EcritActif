import { MODES_COLORISATION, type ReglagesColorisation } from '../lib/reglagesColorisation';
import type { ModeColorisation } from '../lib/colorisation';

interface Props {
  // null : pas de réglage, l'élève voit les quatre modes et commence par les syllabes.
  valeur: ReglagesColorisation | null;
  onChange: (r: ReglagesColorisation) => void;
}

const TOUS = MODES_COLORISATION.map((m) => m.id);

export default function ReglageColorisation({ valeur, onChange }: Props) {
  const permis = valeur?.permis ?? TOUS;
  const defaut = valeur?.defaut ?? 'syllabes';
  // L'ordre des modes reste celui de la liste, quel que soit l'ordre des clics.
  const ordonnes = (l: ModeColorisation[]) => TOUS.filter((m) => l.includes(m));

  const changerDefaut = (m: ModeColorisation) => onChange({ defaut: m, permis: ordonnes([...permis, m]) });
  const basculer = (m: ModeColorisation) => {
    const suite = ordonnes(permis.includes(m) ? permis.filter((x) => x !== m) : [...permis, m]);
    onChange({ defaut: suite.includes(defaut) ? defaut : suite[0], permis: suite });
  };

  return (
    <fieldset>
      <legend>Colorisation de cet élève</legend>
      <label>
        Mode affiché au départ{' '}
        <select value={defaut} onChange={(e) => changerDefaut(e.target.value as ModeColorisation)}>
          {MODES_COLORISATION.map((m) => (
            <option key={m.id} value={m.id}>
              {m.libelle}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm">L’élève peut choisir parmi les modes cochés. Peu de modes, c’est moins de choix à faire : cochez seulement ceux qui l’aident.</p>
      {MODES_COLORISATION.map((m) => (
        <label key={m.id} className="block">
          <input type="checkbox" checked={permis.includes(m.id)} disabled={permis.length === 1 && permis.includes(m.id)} onChange={() => basculer(m.id)} /> {m.libelle}
        </label>
      ))}
    </fieldset>
  );
}
